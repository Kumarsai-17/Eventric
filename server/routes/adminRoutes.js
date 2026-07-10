const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { getDashboardStats, getAllUsers, toggleBanUser, getAllEventsAdmin } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/ban", toggleBanUser);
router.get("/events", getAllEventsAdmin);

module.exports = router;
