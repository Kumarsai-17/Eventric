const express = require("express");
const { protect } = require("../middleware/auth");
const {
  listTicketForResale,
  getResaleListings,
  createResaleOrder,
  confirmResalePurchase,
  buyResaleTicket,
  cancelResaleListing,
} = require("../controllers/resaleController");

const router = express.Router();

router.get("/", getResaleListings);
router.post("/", protect, listTicketForResale);
router.post("/:id/order", protect, createResaleOrder);
router.post("/:id/confirm", protect, confirmResalePurchase);
router.post("/:id/buy", protect, buyResaleTicket); // Deprecated - keeping for backwards compatibility
router.delete("/:id", protect, cancelResaleListing);

module.exports = router;
