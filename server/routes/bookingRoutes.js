const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  lockSeats,
  unlockSeats,
  confirmBooking,
  getMyBookings,
  checkInTicket,
  cancelBooking,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/lock", protect, lockSeats);
router.post("/unlock", protect, unlockSeats);
router.post("/confirm", protect, confirmBooking);
router.get("/my", protect, getMyBookings);
router.post("/checkin", protect, authorize("organizer", "admin"), checkInTicket);
router.post("/:id/cancel", protect, cancelBooking);

module.exports = router;
