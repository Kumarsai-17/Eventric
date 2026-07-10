import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardStats, fetchAllUsers, toggleBanUser, fetchAllEventsAdmin } from "../services/adminService";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/admin.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchAllUsers(), fetchAllEventsAdmin()])
      .then(([statsData, usersData, eventsData]) => {
        setStats(statsData?.stats || null);
        setUsers(usersData?.users || []);
        setEvents(eventsData?.events || []);
      })
      .catch((error) => {
        console.error("Error loading admin dashboard:", error);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleBan = async (id) => {
    const { user } = await toggleBanUser(id);
    setUsers((prev) => prev.map((u) => (u._id === id ? user : u)));
  };

  if (loading) return <LoadingSpinner label="Loading admin dashboard" />;

  return (
    <div className="container section admin">
      <div className="admin__header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Manage platform, users, and events</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/create-event")}>
          + Create Event
        </button>
      </div>

      <div className="admin__tabs">
        {["overview", "users", "events"].map((t) => (
          <button key={t} className={`admin__tab ${tab === t ? "is-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="admin__stats">
          {stats ? (
            <>
              <div className="admin__stat-card">
                <span>Users</span>
                <strong>{stats.userCount || 0}</strong>
              </div>
              <div className="admin__stat-card">
                <span>Live events</span>
                <strong>{stats.eventCount || 0}</strong>
              </div>
              <div className="admin__stat-card">
                <span>Confirmed bookings</span>
                <strong>{stats.bookingCount || 0}</strong>
              </div>
              <div className="admin__stat-card">
                <span>Active resale listings</span>
                <strong>{stats.activeResaleCount || 0}</strong>
              </div>
              <div className="admin__stat-card admin__stat-card--accent">
                <span>Total revenue</span>
                <strong>₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}</strong>
              </div>
            </>
          ) : (
            <div className="admin__error">
              <p>⚠️ Unable to load dashboard statistics</p>
              <button className="btn btn-outline" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="admin__table-container">
          {users.length > 0 ? (
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td className="mono">{u.role}</td>
                    <td>
                      <span className={`badge ${u.isBanned ? "badge-live" : "badge-accent"}`}>
                        {u.isBanned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline" onClick={() => handleToggleBan(u._id)}>
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin__empty">
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="admin__table-container">
          {events.length > 0 ? (
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organizer</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e._id}>
                    <td>{e.title}</td>
                    <td>{e.organizer?.name || "Unknown"}</td>
                    <td className="mono">
                      {e.seatsAvailable || 0}/{e.totalSeats || 0}
                    </td>
                    <td>
                      <span className="badge badge-muted">{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin__empty">
              <p>No events found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
