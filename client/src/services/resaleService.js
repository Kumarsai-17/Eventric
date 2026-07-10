import api from "./api";

export const fetchResaleListings = (params) => api.get("/resale", { params }).then((r) => r.data);
export const listTicketForResale = (payload) => api.post("/resale", payload).then((r) => r.data);
export const createResaleOrder = (id) => api.post(`/resale/${id}/order`).then((r) => r.data);
export const confirmResalePurchase = (id, payload) => api.post(`/resale/${id}/confirm`, payload).then((r) => r.data);
export const buyResaleTicket = (id) => api.post(`/resale/${id}/buy`).then((r) => r.data); // Deprecated
export const cancelResaleListing = (id) => api.delete(`/resale/${id}`).then((r) => r.data);
