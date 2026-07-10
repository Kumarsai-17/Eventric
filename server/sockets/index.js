const registerSeatSocket = require("./seatSocket");

const initSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    registerSeatSocket(io, socket);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSockets;
