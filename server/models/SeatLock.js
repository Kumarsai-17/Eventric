const mongoose = require("mongoose");

// Temporary seat holds while a user is checking out.
// TTL index auto-expires the document so seats are released automatically.
const seatLockSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    seatId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    socketId: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

seatLockSchema.index({ event: 1, seatId: 1 }, { unique: true });
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("SeatLock", seatLockSchema);
