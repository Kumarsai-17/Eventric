import api from "./api";

export const lockSeats = (payload) => api.post("/bookings/lock", payload).then((r) => r.data);
export const unlockSeats = (payload) => api.post("/bookings/unlock", payload).then((r) => r.data);
export const confirmBooking = (payload) => api.post("/bookings/confirm", payload).then((r) => r.data);
export const fetchMyBookings = () => api.get("/bookings/my").then((r) => r.data);
export const checkInTicket = (ticketToken) => api.post("/bookings/checkin", { ticketToken }).then((r) => r.data);
export const cancelBooking = (bookingId) => api.post(`/bookings/${bookingId}/cancel`).then((r) => r.data);

export const createPaymentOrder = (amount) => api.post("/payments/order", { amount }).then((r) => r.data);
export const verifyPayment = (payload) => api.post("/payments/verify", payload).then((r) => r.data);
