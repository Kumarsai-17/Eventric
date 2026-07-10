import api from "./api";

export const fetchDashboardStats = () => api.get("/admin/stats").then((r) => r.data);
export const fetchAllUsers = () => api.get("/admin/users").then((r) => r.data);
export const toggleBanUser = (id) => api.put(`/admin/users/${id}/ban`).then((r) => r.data);
export const fetchAllEventsAdmin = () => api.get("/admin/events").then((r) => r.data);
