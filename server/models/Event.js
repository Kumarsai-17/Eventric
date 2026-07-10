const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true }, // e.g. "A1", "B12"
    row: { type: String, required: true },
    number: { type: Number, required: true },
    tier: { type: String, enum: ["general", "silver", "gold", "platinum"], default: "general" },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, required: [true, "Description is required"] },
    category: {
      type: String,
      enum: ["music", "sports", "movies", "comedy", "conference", "festival", "other"],
      default: "other",
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    venue: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
    },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    seats: { type: [seatSchema], default: [] },
    totalSeats: { type: Number, default: 0 },
    seatsAvailable: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "published",
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

eventSchema.index({ "venue.location": "2dsphere" });
eventSchema.index({ title: "text", description: "text", tags: "text" });

eventSchema.pre("save", function (next) {
  if (this.isModified("seats")) {
    this.totalSeats = this.seats.length;
    this.seatsAvailable = this.seats.filter((s) => s.status === "available").length;
  }
  next();
});

module.exports = mongoose.model("Event", eventSchema);
