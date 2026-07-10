import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    
    // Wait for connection before authenticating
    s.on("connect", () => {
      const token = localStorage.getItem("eventric_token");
      if (token) s.emit("auth", token);
    });

    // Handle auth success/failure
    s.on("auth:success", () => {
      console.log("[Socket] Authenticated successfully");
    });

    s.on("auth:error", (message) => {
      console.error("[Socket] Authentication failed:", message);
    });
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
