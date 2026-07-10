const Razorpay = require("razorpay");

// Mock payment gateway for development (when USE_MOCK_PAYMENT=true)
const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === "true";

let paymentGateway;

if (USE_MOCK_PAYMENT) {
  console.log("[Payment] Using MOCK payment gateway (development mode)");
  
  // Mock payment gateway instance
  paymentGateway = {
    orders: {
      create: async (options) => {
        // Simulate payment order creation
        return {
          id: `order_mock_${Date.now()}`,
          entity: "order",
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency || "INR",
          receipt: options.receipt,
          status: "created",
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000),
        };
      },
    },
  };
} else {
  // Real Razorpay instance
  paymentGateway = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

module.exports = paymentGateway;
