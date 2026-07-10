// Central error handling middleware. Any thrown error / rejected promise
// (via express-async-handler) ends up here with a consistent JSON shape.

const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // Log error for debugging
  console.error(`[Error] ${err.message}`, process.env.NODE_ENV !== "production" ? err.stack : "");

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
  }

  // Hide detailed error messages in production for 500 errors
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
