import api from "./api";

export const fetchEvents = (params) => api.get("/events", { params }).then((r) => r.data);
export const fetchEventById = (id) => api.get(`/events/${id}`).then((r) => r.data);
export const createEvent = (payload) => api.post("/events", payload).then((r) => r.data);
export const updateEvent = (id, payload) => api.put(`/events/${id}`, payload).then((r) => r.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then((r) => r.data);
export const uploadCoverImage = (id, file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.put(`/events/${id}/cover`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
