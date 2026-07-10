const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");
const {
  createEvent,
  uploadCoverImage,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", getEvents);
router.get("/:id", getEventById);

router.post("/", protect, authorize("organizer", "admin"), createEvent);
router.put("/:id", protect, authorize("organizer", "admin"), updateEvent);
router.delete("/:id", protect, authorize("organizer", "admin"), deleteEvent);
router.put("/:id/cover", protect, authorize("organizer", "admin"), upload.single("image"), uploadCoverImage);

module.exports = router;
