const asyncHandler = require("express-async-handler");
const Event = require("../models/Event");
const cloudinary = require("../config/cloudinary");

// Builds the initial seat grid for a new event from a simple tier config,
// e.g. [{ tier: "gold", rows: 5, seatsPerRow: 10, price: 2000 }]
const buildSeatMap = (seatConfig = []) => {
  const seats = [];
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let rowOffset = 0;

  seatConfig.forEach(({ tier, rows, seatsPerRow, price }) => {
    for (let r = 0; r < rows; r++) {
      const row = rowLetters[rowOffset + r] || `R${rowOffset + r}`;
      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push({ seatId: `${row}${n}`, row, number: n, tier, price, status: "available" });
      }
    }
    rowOffset += rows;
  });

  return seats;
};

// @desc    Create event (organizer/admin)
// @route   POST /api/events
// @access  Private (organizer, admin)
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, venue, startDateTime, endDateTime, seatConfig, tags } = req.body;

  const seats = buildSeatMap(seatConfig);
  if (seats.length === 0) {
    res.status(400);
    throw new Error("Provide at least one seat tier configuration");
  }

  const event = await Event.create({
    title,
    description,
    category,
    organizer: req.user._id,
    venue,
    startDateTime,
    endDateTime,
    seats,
    tags,
  });

  res.status(201).json({ success: true, event });
});

// @desc    Upload / replace event cover image
// @route   PUT /api/events/:id/cover
// @access  Private (organizer who owns event, admin)
const uploadCoverImage = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  if (String(event.organizer) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You do not own this event");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided");
  }

  // Check if Cloudinary is configured
  const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

  if (!cloudinaryConfigured) {
    res.status(503);
    throw new Error("Image upload service not configured. Please set up Cloudinary credentials.");
  }

  if (event.coverImage.publicId) {
    await cloudinary.uploader.destroy(event.coverImage.publicId).catch(() => {});
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "eventric/events" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(req.file.buffer);
  });

  event.coverImage = { url: uploadResult.secure_url, publicId: uploadResult.public_id };
  await event.save();

  res.json({ success: true, event });
});

// @desc    List / search events with filters
// @route   GET /api/events
// @access  Public
const getEvents = asyncHandler(async (req, res) => {
  const { search, category, city, lng, lat, radiusKm, page = 1, limit = 12 } = req.query;

  const query = { status: "published" };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query["venue.city"] = new RegExp(`^${city}$`, "i");

  if (lng && lat) {
    query["venue.location"] = {
      $near: {
        $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: (parseFloat(radiusKm) || 25) * 1000,
      },
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(query).sort({ startDateTime: 1 }).skip(skip).limit(Number(limit)).populate("organizer", "name"),
    Event.countDocuments(query),
  ]);

  res.json({ success: true, events, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc    Get single event with live seat map
// @route   GET /api/events/:id
// @access  Public
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate("organizer", "name email");
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  res.json({ success: true, event });
});

// @desc    Update event details
// @route   PUT /api/events/:id
// @access  Private (owner organizer, admin)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  if (String(event.organizer) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You do not own this event");
  }

  const editable = ["title", "description", "category", "venue", "startDateTime", "endDateTime", "tags", "status"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });

  await event.save();
  res.json({ success: true, event });
});

// @desc    Delete / cancel event
// @route   DELETE /api/events/:id
// @access  Private (owner organizer, admin)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  if (String(event.organizer) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You do not own this event");
  }

  event.status = "cancelled";
  await event.save();
  res.json({ success: true, message: "Event cancelled" });
});

module.exports = { createEvent, uploadCoverImage, getEvents, getEventById, updateEvent, deleteEvent };
