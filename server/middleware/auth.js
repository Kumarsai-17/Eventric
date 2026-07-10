const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Verifies JWT and attaches the user to req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. Please log in.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error("User no longer exists");
    }
    if (user.isBanned) {
      res.status(403);
      throw new Error("This account has been banned");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized. Token invalid or expired.");
  }
});

// Restricts a route to specific roles, e.g. authorize("admin", "organizer")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("You do not have permission to perform this action");
    }
    next();
  };
};

module.exports = { protect, authorize };
