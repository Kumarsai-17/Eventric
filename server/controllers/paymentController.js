const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const payment = require("../config/payment");
const Payment = require("../models/Payment");

const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === "true";

// @desc    Create a payment order for the seats being purchased
// @route   POST /api/payments/order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body; // amount in rupees

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("Invalid payment amount");
  }

  const order = await payment.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  const paymentRecord = await Payment.create({
    user: req.user._id,
    razorpayOrderId: order.id,
    amount,
    status: "created",
  });

  // For mock payment, provide a mock key
  const paymentKey = USE_MOCK_PAYMENT ? "rzp_test_mock_key" : process.env.RAZORPAY_KEY_ID;

  res.status(201).json({ 
    success: true, 
    order, 
    paymentId: paymentRecord._id, 
    key: paymentKey,
    isMockPayment: USE_MOCK_PAYMENT 
  });
});

// @desc    Verify payment signature after checkout completes
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const paymentRecord = await Payment.findById(paymentId);
  if (!paymentRecord) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  if (USE_MOCK_PAYMENT) {
    // Mock payment verification - always succeeds in test mode
    console.log("[Payment] Mock payment verification successful");
    
    paymentRecord.razorpayPaymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
    paymentRecord.razorpaySignature = razorpay_signature || "mock_signature";
    paymentRecord.status = "paid";
    await paymentRecord.save();

    return res.json({ 
      success: true, 
      message: "Mock payment verified successfully", 
      paymentId: paymentRecord._id,
      isMockPayment: true
    });
  }

  // Real Razorpay verification
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    paymentRecord.status = "failed";
    await paymentRecord.save();
    res.status(400);
    throw new Error("Payment signature verification failed");
  }

  paymentRecord.razorpayPaymentId = razorpay_payment_id;
  paymentRecord.razorpaySignature = razorpay_signature;
  paymentRecord.status = "paid";
  await paymentRecord.save();

  res.json({ success: true, message: "Payment verified", paymentId: paymentRecord._id });
});

module.exports = { createOrder, verifyPayment };
