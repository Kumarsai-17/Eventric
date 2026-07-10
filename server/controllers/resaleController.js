const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Resale = require("../models/Resale");
const Booking = require("../models/Booking");
const { generateTicketQR } = require("../utils/generateQR");
const sendNotification = require("../utils/sendNotification");

// @desc    List an owned, unused ticket for resale
// @route   POST /api/resale
// @access  Private
const listTicketForResale = asyncHandler(async (req, res) => {
  const { bookingId, seatId, resalePrice } = req.body;

  const booking = await Booking.findById(bookingId).populate("event");
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  if (String(booking.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You do not own this ticket");
  }
  if (booking.checkedIn) {
    res.status(400);
    throw new Error("Cannot resell a ticket that has already been used");
  }

  // TIME CONTROL: Check if event has already passed
  const now = new Date();
  if (booking.event.startDateTime < now) {
    res.status(400);
    throw new Error("Cannot list tickets for past events");
  }

  // TIME CONTROL: Cannot list tickets within 24 hours of event start
  const hoursUntilEvent = (booking.event.startDateTime - now) / (1000 * 60 * 60);
  if (hoursUntilEvent < 24) {
    res.status(400);
    throw new Error("Cannot list tickets within 24 hours of event start");
  }

  const seat = booking.seats.find((s) => s.seatId === seatId);
  if (!seat) {
    res.status(404);
    throw new Error("Seat not found on this booking");
  }
  if (resalePrice > seat.price) {
    res.status(400);
    throw new Error("Resale price cannot exceed the original ticket price");
  }

  // Check if this seat is already listed for resale
  const existingListing = await Resale.findOne({
    booking: bookingId,
    seatId,
    status: "listed",
  });

  if (existingListing) {
    res.status(400);
    throw new Error("This seat is already listed for resale");
  }

  const resale = await Resale.create({
    booking: bookingId,
    event: booking.event._id,
    seller: req.user._id,
    seatId,
    originalPrice: seat.price,
    resalePrice,
  });

  res.status(201).json({ success: true, resale });
});

// @desc    Browse active resale marketplace listings
// @route   GET /api/resale
// @access  Public
const getResaleListings = asyncHandler(async (req, res) => {
  const { eventId, city, sellerId } = req.query;
  const query = { status: "listed" };
  if (eventId) query.event = eventId;
  if (sellerId) query.seller = sellerId;

  const listings = await Resale.find(query)
    .populate({ path: "event", select: "title startDateTime venue coverImage", match: city ? { "venue.city": new RegExp(`^${city}$`, "i") } : {} })
    .populate("seller", "name")
    .sort({ createdAt: -1 });

  // TIME CONTROL: Filter out listings for events that have already started or are within 2 hours
  const now = new Date();
  const filteredListings = listings.filter((l) => {
    if (!l.event) return false;
    const hoursUntilEvent = (l.event.startDateTime - now) / (1000 * 60 * 60);
    return hoursUntilEvent >= 2; // Must be at least 2 hours before event
  });

  res.json({ success: true, listings: filteredListings });
});

// @desc    Create payment order for resale ticket purchase (step 1)
// @route   POST /api/resale/:id/order
// @access  Private
const createResaleOrder = asyncHandler(async (req, res) => {
  const resale = await Resale.findById(req.params.id).populate("event");
  
  if (!resale || resale.status !== "listed") {
    res.status(409);
    throw new Error("This resale listing is no longer available");
  }
  
  if (String(resale.seller) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot buy your own resale listing");
  }

  // TIME CONTROL: Check if event has already started
  const now = new Date();
  if (resale.event.startDateTime < now) {
    res.status(400);
    throw new Error("Cannot purchase tickets for events that have already started");
  }

  // TIME CONTROL: Cannot buy tickets within 2 hours of event start
  const hoursUntilEvent = (resale.event.startDateTime - now) / (1000 * 60 * 60);
  if (hoursUntilEvent < 2) {
    res.status(400);
    throw new Error("Cannot purchase tickets within 2 hours of event start");
  }

  // Create payment order (similar to normal booking)
  const Payment = require("../models/Payment");
  const paymentGateway = require("../config/payment");
  const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === "true";
  
  const order = await paymentGateway.orders.create({
    amount: Math.round(resale.resalePrice * 100), // paise
    currency: "INR",
    receipt: `resale_${Date.now()}`,
  });
  
  // Create payment record with "created" status
  const paymentRecord = await Payment.create({
    user: req.user._id,
    razorpayOrderId: order.id,
    amount: resale.resalePrice,
    status: "created",
  });

  const paymentKey = USE_MOCK_PAYMENT ? "rzp_test_mock_key" : process.env.RAZORPAY_KEY_ID;

  res.status(201).json({ 
    success: true, 
    order, 
    paymentId: paymentRecord._id, 
    key: paymentKey,
    isMockPayment: USE_MOCK_PAYMENT,
    resale: {
      _id: resale._id,
      seatId: resale.seatId,
      resalePrice: resale.resalePrice,
      eventTitle: resale.event.title
    }
  });
});

// @desc    Verify payment and complete resale purchase (step 2)
// @route   POST /api/resale/:id/confirm
// @access  Private
const confirmResalePurchase = asyncHandler(async (req, res) => {
  const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === "true";

  // Verify payment
  const Payment = require("../models/Payment");
  const paymentRecord = await Payment.findById(paymentId);
  
  if (!paymentRecord) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  if (USE_MOCK_PAYMENT) {
    console.log("[Resale Payment] Mock payment verification successful");
    paymentRecord.razorpayPaymentId = razorpay_payment_id || `pay_resale_mock_${Date.now()}`;
    paymentRecord.razorpaySignature = razorpay_signature || "mock_signature";
    paymentRecord.status = "paid";
    await paymentRecord.save();
  } else {
    // Real Razorpay verification
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      paymentRecord.status = "failed";
      await paymentRecord.save();
      res.status(400);
      throw new Error("Payment signature verification failed");
    }

    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.status = "paid";
    await paymentRecord.save();
  }

  // Now process the resale purchase with transaction
  const session = await mongoose.startSession();
  try {
    let updatedBooking;
    let resale;
    await session.withTransaction(async () => {
      resale = await Resale.findById(req.params.id).populate("event").session(session);
      
      if (!resale || resale.status !== "listed") {
        const err = new Error("This resale listing is no longer available");
        err.statusCode = 409;
        throw err;
      }
      
      if (String(resale.seller) === String(req.user._id)) {
        const err = new Error("You cannot buy your own resale listing");
        err.statusCode = 400;
        throw err;
      }

      const booking = await Booking.findById(resale.booking).session(session);
      if (!booking) throw new Error("Original booking not found");

      booking.ownershipHistory.push({
        owner: booking.user,
        transferredAt: new Date(),
        price: resale.resalePrice,
      });
      booking.user = req.user._id; // New owner (buyer)
      booking.isResold = true;
      booking.resalePayment = paymentRecord._id; // Link the resale payment
      booking.resaleSeller = resale.seller; // Track who gets the money
      await booking.save({ session });

      resale.status = "sold";
      resale.buyer = req.user._id;
      resale.soldAt = new Date();
      resale.payment = paymentRecord._id;
      await resale.save({ session });

      updatedBooking = booking;
    });

    // Rotate QR outside the transaction
    const { data, image } = await generateTicketQR({
      bookingId: updatedBooking._id,
      eventId: updatedBooking.event,
      seatId: resale.seatId,
    });
    updatedBooking.qrCode = { data, image };
    await updatedBooking.save();

    const io = req.app.get("io");
    
    // Notify seller - they received payment
    await sendNotification({
      io,
      userId: resale.seller,
      title: "💰 Payment Received - Ticket Sold!",
      message: `Your ticket for ${resale.event.title} (Seat ${resale.seatId}) has been sold for ₹${resale.resalePrice}. The payment has been processed to your account.`,
      type: "payment",
    });

    // Notify buyer
    await sendNotification({
      io,
      userId: req.user._id,
      title: "🎫 Resale Ticket Purchased",
      message: `You successfully purchased seat ${resale.seatId} for ₹${resale.resalePrice}. Check My Tickets for your QR code.`,
      type: "resale",
    });

    res.json({ 
      success: true, 
      booking: updatedBooking,
      message: `Ticket purchased for ₹${resale.resalePrice}. Seller will receive payment.`
    });
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Purchase a resale ticket: processes payment to seller, transfers ownership,
//          rotates the QR code and marks the listing sold - all atomic.
// @route   POST /api/resale/:id/buy
// @access  Private
// @deprecated Use /order and /confirm flow instead
const buyResaleTicket = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let updatedBooking;
    let resale;
    await session.withTransaction(async () => {
      resale = await Resale.findById(req.params.id).populate("event").session(session);
      if (!resale || resale.status !== "listed") {
        const err = new Error("This resale listing is no longer available");
        err.statusCode = 409;
        throw err;
      }
      if (String(resale.seller) === String(req.user._id)) {
        const err = new Error("You cannot buy your own resale listing");
        err.statusCode = 400;
        throw err;
      }

      // TIME CONTROL: Check if event has already started
      const now = new Date();
      if (resale.event.startDateTime < now) {
        const err = new Error("Cannot purchase tickets for events that have already started");
        err.statusCode = 400;
        throw err;
      }

      // TIME CONTROL: Cannot buy tickets within 2 hours of event start
      const hoursUntilEvent = (resale.event.startDateTime - now) / (1000 * 60 * 60);
      if (hoursUntilEvent < 2) {
        const err = new Error("Cannot purchase tickets within 2 hours of event start");
        err.statusCode = 400;
        throw err;
      }

      // Process payment - create payment record for resale (same flow as normal booking)
      const Payment = require("../models/Payment");
      const paymentGateway = require("../config/payment");
      const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === "true";
      
      // Create payment order for the resale price
      const order = await paymentGateway.orders.create({
        amount: Math.round(resale.resalePrice * 100), // paise
        currency: "INR",
        receipt: `resale_${Date.now()}`,
      });
      
      // Create payment record - marking it as paid immediately for resale
      // In a real system, this would go through the same verify flow
      const payment = await Payment.create([{
        user: req.user._id, // Buyer pays
        razorpayOrderId: order.id,
        razorpayPaymentId: USE_MOCK_PAYMENT ? `pay_resale_mock_${Date.now()}` : null,
        razorpaySignature: USE_MOCK_PAYMENT ? "mock_signature" : null,
        amount: resale.resalePrice,
        status: "paid", // Mark as paid immediately for resale transactions
      }], { session });
      
      // Store seller info in booking for payout tracking
      console.log(`[Resale] Payment processed: ₹${resale.resalePrice} from buyer ${req.user._id} to seller ${resale.seller}`);

      const booking = await Booking.findById(resale.booking).session(session);
      if (!booking) throw new Error("Original booking not found");

      booking.ownershipHistory.push({
        owner: booking.user,
        transferredAt: new Date(),
        price: resale.resalePrice,
      });
      booking.user = req.user._id; // New owner (buyer)
      booking.isResold = true;
      booking.resalePayment = payment[0]._id; // Link the resale payment
      booking.resaleSeller = resale.seller; // Track who gets the money
      await booking.save({ session });

      resale.status = "sold";
      resale.buyer = req.user._id;
      resale.soldAt = new Date();
      resale.payment = payment[0]._id;
      await resale.save({ session });

      updatedBooking = booking;
    });

    // Rotate QR outside the transaction
    const { data, image } = await generateTicketQR({
      bookingId: updatedBooking._id,
      eventId: updatedBooking.event,
      seatId: resale.seatId,
    });
    updatedBooking.qrCode = { data, image };
    await updatedBooking.save();

    const io = req.app.get("io");
    
    // Notify seller - they received payment
    await sendNotification({
      io,
      userId: resale.seller,
      title: "💰 Payment Received - Ticket Sold!",
      message: `Your ticket for ${resale.event.title} (Seat ${resale.seatId}) has been sold for ₹${resale.resalePrice}. The payment has been processed to your account.`,
      type: "payment",
    });

    // Notify buyer
    await sendNotification({
      io,
      userId: req.user._id,
      title: "🎫 Resale Ticket Purchased",
      message: `You successfully purchased seat ${resale.seatId} for ₹${resale.resalePrice}. Check My Tickets for your QR code.`,
      type: "resale",
    });

    res.json({ 
      success: true, 
      booking: updatedBooking,
      message: `Ticket purchased for ₹${resale.resalePrice}. Seller will receive payment.`
    });
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Cancel own resale listing
// @route   DELETE /api/resale/:id
// @access  Private
const cancelResaleListing = asyncHandler(async (req, res) => {
  const resale = await Resale.findById(req.params.id).populate("event");
  if (!resale) {
    res.status(404);
    throw new Error("Listing not found");
  }
  if (String(resale.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You do not own this listing");
  }

  // TIME CONTROL: Check if event has already passed
  const now = new Date();
  if (resale.event.startDateTime < now) {
    res.status(400);
    throw new Error("Cannot cancel listings for past events");
  }

  // TIME CONTROL: Cannot cancel within 12 hours of event start
  const hoursUntilEvent = (resale.event.startDateTime - now) / (1000 * 60 * 60);
  if (hoursUntilEvent < 12) {
    res.status(400);
    throw new Error("Cannot cancel resale listing within 12 hours of event start");
  }

  resale.status = "cancelled";
  await resale.save();
  res.json({ success: true, message: "Listing cancelled" });
});

module.exports = { 
  listTicketForResale, 
  getResaleListings, 
  createResaleOrder,
  confirmResalePurchase,
  buyResaleTicket, 
  cancelResaleListing 
};
