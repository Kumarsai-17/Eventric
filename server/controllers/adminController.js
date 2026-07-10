const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Resale = require("../models/Resale");

// @desc    High-level platform stats for the admin dashboard
// @route   GET /api/admin/stats
// @access  Private (admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [userCount, eventCount, bookingCount, activeResaleCount, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments({ status: { $ne: "cancelled" } }),
    Booking.countDocuments({ status: "confirmed" }),
    Resale.countDocuments({ status: "listed" }),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  res.json({
    success: true,
    stats: {
      userCount,
      eventCount,
      bookingCount,
      activeResaleCount,
      totalRevenue: revenueAgg[0]?.total || 0,
    },
  });
});

// @desc    List all users (admin)
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// @desc    Ban / unban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (admin)
const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    List all events (admin moderation view)
// @route   GET /api/admin/events
// @access  Private (admin)
const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const events = await Event.find().populate("organizer", "name email").sort({ createdAt: -1 });
  res.json({ success: true, events });
});

module.exports = { getDashboardStats, getAllUsers, toggleBanUser, getAllEventsAdmin };
