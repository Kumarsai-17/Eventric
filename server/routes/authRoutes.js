const express = require("express");
const { body } = require("express-validator");
const { registerUser, loginUser, getMe, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  registerUser
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("Enter a valid email"), body("password").notEmpty().withMessage("Password is required")],
  validate,
  loginUser
);

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

module.exports = router;
