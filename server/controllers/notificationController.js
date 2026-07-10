const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, notifications, unreadCount });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
