const mongoose = require("mongoose");

const resaleSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seatId: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    resalePrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["listed", "sold", "cancelled"],
      default: "listed",
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    soldAt: { type: Date },
  },
  { timestamps: true }
);

resaleSchema.pre("validate", function (next) {
  if (this.resalePrice > this.originalPrice) {
    return next(new Error("Resale price cannot exceed the original ticket price"));
  }
  next();
});

module.exports = mongoose.model("Resale", resaleSchema);
