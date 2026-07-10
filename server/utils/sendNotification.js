const Notification = require("../models/Notification");

// Persists a notification and, if an io instance is provided, pushes it
// live to the user's socket room for instant in-app delivery.
const sendNotification = async ({ io, userId, title, message, type = "system", link = "" }) => {
  const notification = await Notification.create({ user: userId, title, message, type, link });

  if (io) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  }

  return notification;
};

module.exports = sendNotification;
