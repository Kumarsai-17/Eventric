const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const SeatLock = require("../models/SeatLock");
const Booking = require("../models/Booking");
const { generateTicketQR } = require("../utils/generateQR");

const LOCK_TTL_MS = (Number(process.env.SEAT_LOCK_TTL) || 300) * 1000;

// @desc    Temporarily lock seats while the user checks out (called via REST as a
//          fallback to the socket flow, e.g. before payment order creation)
// @route   POST /api/bookings/lock
// @access  Private
const lockSeats = asyncHandler(async (req, res) => {
  const { eventId, seatIds } = req.body;
  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  const expiresAt = new Date(Date.now() + LOCK_TTL_MS);
  const locked = [];

  for (const seatId of seatIds) {
    const seat = event.seats.find((s) => s.seatId === seatId);
    if (!seat || seat.status !== "available") {
      res.status(409);
      throw new Error(`Seat ${seatId} is no longer available`);
    }

    try {
      await SeatLock.create({ event: eventId, seatId, user: req.user._id, expiresAt });
      seat.status = "locked";
      locked.push(seatId);
    } catch (err) {
      // Duplicate key -> already locked by someone else (race condition guard)
      res.status(409);
      throw new Error(`Seat ${seatId} was just locked by another user`);
    }
  }

  await event.save();

  const io = req.app.get("io");
  io.to(`event:${eventId}`).emit("seats:locked", { seatIds: locked, lockedBy: req.user._id });

  res.json({ success: true, lockedSeats: locked, expiresAt });
});

// @desc    Release seat locks (user cancels checkout)
// @route   POST /api/bookings/unlock
// @access  Private
const unlockSeats = asyncHandler(async (req, res) => {
  const { eventId, seatIds } = req.body;

  await SeatLock.deleteMany({ event: eventId, seatId: { $in: seatIds }, user: req.user._id });

  const event = await Event.findById(eventId);
  if (event) {
    event.seats.forEach((s) => {
      if (seatIds.includes(s.seatId) && s.status === "locked") s.status = "available";
    });
    await event.save();
  }

  const io = req.app.get("io");
  io.to(`event:${eventId}`).emit("seats:unlocked", { seatIds });

  res.json({ success: true, message: "Seats released" });
});

// @desc    Confirm booking after successful payment - converts locked seats to
//          booked, generates a unique QR ticket per seat, prevents double booking
//          via a MongoDB transaction.
// @route   POST /api/bookings/confirm
// @access  Private
const confirmBooking = asyncHandler(async (req, res) => {
  const { eventId, seatIds, paymentId } = req.body;

  const session = await mongoose.startSession();
  try {
    let booking;
    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);
      if (!event) throw new Error("Event not found");

      const seatDetails = [];
      let totalAmount = 0;

      for (const seatId of seatIds) {
        const seat = event.seats.find((s) => s.seatId === seatId);
        if (!seat || seat.status === "booked") {
          const err = new Error(`Seat ${seatId} is already booked`);
          err.statusCode = 409;
          throw err;
        }
        seat.status = "booked";
        seatDetails.push({ seatId: seat.seatId, tier: seat.tier, price: seat.price });
        totalAmount += seat.price;
      }

      await event.save({ session });
      await SeatLock.deleteMany({ event: eventId, seatId: { $in: seatIds } }).session(session);

      const [newBooking] = await Booking.create(
        [
          {
            user: req.user._id,
            event: eventId,
            seats: seatDetails,
            totalAmount,
            payment: paymentId,
            status: "confirmed",
            originalOwner: req.user._id,
          },
        ],
        { session }
      );
      booking = newBooking;
    });

    // Generate QR after transaction commits (I/O outside the DB transaction)
    const { data, image } = await generateTicketQR({
      bookingId: booking._id,
      eventId,
      seatId: booking.seats.map((s) => s.seatId).join("-"),
    });
    booking.qrCode = { data, image };
    await booking.save();

    const io = req.app.get("io");
    io.to(`event:${eventId}`).emit("seats:booked", { seatIds });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get logged-in user's bookings / tickets
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("event", "title startDateTime venue coverImage")
    .sort({ createdAt: -1 });
  res.json({ success: true, bookings });
});

// @desc    Validate / check in a ticket by scanning its QR token
// @route   POST /api/bookings/checkin
// @access  Private (organizer, admin)
const checkInTicket = asyncHandler(async (req, res) => {
  const { ticketToken } = req.body;
  const { verifyTicketQR } = require("../utils/generateQR");
  const result = verifyTicketQR(ticketToken);

  if (!result.valid) {
    res.status(400);
    throw new Error("Invalid or tampered QR code");
  }

  const booking = await Booking.findById(result.bookingId).populate("event", "title organizer");
  if (!booking || booking.qrCode.data !== ticketToken) {
    res.status(400);
    throw new Error("QR code does not match any active ticket (may have been invalidated by resale)");
  }
  if (booking.checkedIn) {
    res.status(409);
    throw new Error("Ticket already checked in");
  }
  if (booking.status !== "confirmed") {
    res.status(400);
    throw new Error("Ticket is not in a valid confirmed state");
  }

  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  await booking.save();

  res.json({ success: true, message: "Ticket verified and checked in", booking });
});

// @desc    Cancel a booking (with time restrictions)
// @route   POST /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("event");
  
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (String(booking.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You do not own this booking");
  }

  if (booking.status === "cancelled") {
    res.status(400);
    throw new Error("Booking is already cancelled");
  }

  if (booking.checkedIn) {
    res.status(400);
    throw new Error("Cannot cancel a ticket that has been checked in");
  }

  // TIME CONTROL: Can only cancel within 48 hours of booking
  const hoursSinceBooking = (new Date() - booking.createdAt) / (1000 * 60 * 60);
  if (hoursSinceBooking > 48) {
    res.status(400);
    throw new Error("Cancellation window expired. Tickets can only be cancelled within 48 hours of booking");
  }

  // TIME CONTROL: Cannot cancel within 72 hours of event start
  const now = new Date();
  const hoursUntilEvent = (booking.event.startDateTime - now) / (1000 * 60 * 60);
  if (hoursUntilEvent < 72) {
    res.status(400);
    throw new Error("Cannot cancel tickets within 72 hours of event start");
  }

  // Check if any seats are listed for resale
  const Resale = require("../models/Resale");
  const activeResaleListings = await Resale.find({
    booking: booking._id,
    status: "listed"
  });

  if (activeResaleListings.length > 0) {
    res.status(400);
    throw new Error("Cannot cancel booking with active resale listings. Please cancel all resale listings first");
  }

  // Update booking status
  booking.status = "cancelled";
  await booking.save();

  // Release seats back to available
  const Event = require("../models/Event");
  const event = await Event.findById(booking.event._id);
  if (event) {
    booking.seats.forEach(bookedSeat => {
      const seat = event.seats.find(s => s.seatId === bookedSeat.seatId);
      if (seat && seat.status === "booked") {
        seat.status = "available";
      }
    });
    await event.save();

    // Notify via socket
    const io = req.app.get("io");
    if (io) {
      io.to(`event:${booking.event._id}`).emit("seats:cancelled", { 
        seatIds: booking.seats.map(s => s.seatId) 
      });
    }
  }

  res.json({ 
    success: true, 
    message: "Booking cancelled successfully. Seats released back to the event",
    booking 
  });
});

module.exports = { lockSeats, unlockSeats, confirmBooking, getMyBookings, checkInTicket, cancelBooking };
