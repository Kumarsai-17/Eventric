require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initSockets = require("./sockets");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Validate required environment variables
const useMockPayment = process.env.USE_MOCK_PAYMENT === "true";
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];

// Only require Razorpay keys if not using mock payment
if (!useMockPayment) {
  requiredEnvVars.push("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET");
} else {
  console.log("[Server] 🎭 Using MOCK payment gateway for development");
}

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`[Error] Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const resaleRoutes = require("./routes/resaleRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: process.env.CLIENT_URL || "http://localhost:3000", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
});

// Make io available inside REST controllers via req.app.get("io")
app.set("io", io);

// Security middleware
app.use(helmet({ 
  contentSecurityPolicy: false, // Allow for development; configure properly for production
  crossOriginEmbedderPolicy: false 
}));
app.use(mongoSanitize()); // Prevent NoSQL injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({ 
    success: true, 
    message: "Eventric API is live",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/resale", resaleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

initSockets(io);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Eventric] Server running on port ${PORT}`));
