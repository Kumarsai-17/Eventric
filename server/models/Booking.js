const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    seats: [
      {
        seatId: { type: String, required: true },
        tier: { type: String },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    resalePayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" }, // Payment when bought from resale
    resaleSeller: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who sold this ticket on resale (gets the money)
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "resold"],
      default: "pending",
    },
    qrCode: {
      data: { type: String }, // unique ticket token encoded in QR
      image: { type: String }, // base64 / data URL of QR image
    },
    isResold: { type: Boolean, default: false },
    originalOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ownershipHistory: [
      {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        transferredAt: { type: Date, default: Date.now },
        price: { type: Number },
      },
    ],
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
