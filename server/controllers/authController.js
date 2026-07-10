const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, phone });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Log in
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (user.isBanned) {
    res.status(403);
    throw new Error("This account has been banned");
  }

  const token = generateToken(user._id);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update profile (name, phone, location)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, city, coordinates } = req.body;

  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;
  if (city) req.user.location.city = city;
  if (coordinates) req.user.location.coordinates = coordinates;

  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { registerUser, loginUser, getMe, updateMe };
