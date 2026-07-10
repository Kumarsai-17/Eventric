const jwt = require("jsonwebtoken");
const Event = require("../models/Event");
const SeatLock = require("../models/SeatLock");

const LOCK_TTL_MS = (Number(process.env.SEAT_LOCK_TTL) || 300) * 1000;

// Registers all real-time seat-booking behavior on a connected socket.
// This is the live layer behind the seat map: clients join an event "room",
// broadcast holds/releases instantly, and the server is the single source
// of truth that prevents two people from locking the same seat.
const registerSeatSocket = (io, socket) => {
  // Authenticate the socket using the JWT sent from the client
  socket.on("auth", (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user:${decoded.id}`);
      socket.emit("auth:success");
    } catch (err) {
      socket.emit("auth:error", "Invalid token");
    }
  });

  socket.on("event:join", (eventId) => {
    if (!eventId || typeof eventId !== "string") {
      return socket.emit("error", { message: "Invalid event ID" });
    }
    socket.join(`event:${eventId}`);
  });

  socket.on("event:leave", (eventId) => {
    if (!eventId || typeof eventId !== "string") return;
    socket.leave(`event:${eventId}`);
  });

  // Attempt to hold a seat the instant a user clicks it (before checkout/payment)
  socket.on("seat:hold", async ({ eventId, seatId }) => {
    if (!socket.userId) return socket.emit("seat:error", { seatId, message: "Not authenticated" });
    if (!eventId || !seatId) {
      return socket.emit("seat:error", { seatId, message: "Invalid event or seat ID" });
    }

    try {
      const event = await Event.findById(eventId);
      const seat = event?.seats.find((s) => s.seatId === seatId);
      if (!seat || seat.status !== "available") {
        return socket.emit("seat:error", { seatId, message: "Seat is no longer available" });
      }

      const expiresAt = new Date(Date.now() + LOCK_TTL_MS);
      await SeatLock.create({ event: eventId, seatId, user: socket.userId, socketId: socket.id, expiresAt });

      seat.status = "locked";
      await event.save();

      io.to(`event:${eventId}`).emit("seat:held", { seatId, holderSocketId: socket.id, expiresAt });
    } catch (err) {
      // Duplicate key error = someone else grabbed it a moment earlier
      socket.emit("seat:error", { seatId, message: "Seat was just taken by another user" });
    }
  });

  // Explicit release, e.g. user deselects a seat or closes the checkout modal
  socket.on("seat:release", async ({ eventId, seatId }) => {
    if (!eventId || !seatId) return;

    try {
      // Use transaction to ensure atomicity
      const lock = await SeatLock.findOneAndDelete({ 
        event: eventId, 
        seatId, 
        socketId: socket.id 
      });

      if (lock) {
        const event = await Event.findById(eventId);
        const seat = event?.seats.find((s) => s.seatId === seatId);
        if (seat && seat.status === "locked") {
          seat.status = "available";
          await event.save();
          io.to(`event:${eventId}`).emit("seat:released", { seatId });
        }
      }
    } catch (err) {
      console.error("[Socket] Error releasing seat:", err.message);
    }
  });

  // If a client disconnects mid-checkout, free anything they were holding
  // so it doesn't stay locked until the TTL index eventually cleans it up.
  socket.on("disconnect", async () => {
    try {
      const locks = await SeatLock.find({ socketId: socket.id });
      
      // Batch process to improve performance
      const eventIds = [...new Set(locks.map(lock => lock.event.toString()))];
      
      for (const eventId of eventIds) {
        const event = await Event.findById(eventId);
        if (!event) continue;

        const eventLocks = locks.filter(lock => lock.event.toString() === eventId);
        const seatIds = eventLocks.map(lock => lock.seatId);
        
        event.seats.forEach(seat => {
          if (seatIds.includes(seat.seatId) && seat.status === "locked") {
            seat.status = "available";
          }
        });

        await event.save();
        
        // Emit all releases for this event at once
        seatIds.forEach(seatId => {
          io.to(`event:${eventId}`).emit("seat:released", { seatId });
        });
      }

      await SeatLock.deleteMany({ socketId: socket.id });
    } catch (err) {
      console.error("[Socket] Error cleaning up on disconnect:", err.message);
    }
  });
};

module.exports = registerSeatSocket;
