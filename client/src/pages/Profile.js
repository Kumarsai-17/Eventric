import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/profile.css";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.location?.city || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { user: updatedUser } = await updateProfile(formData);
      updateUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setEditing(false);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return <LoadingSpinner label="Loading profile" />;

  return (
    <div className="container section profile-page">
      <div className="profile-container profile-container--no-sidebar">
        {/* Main Content */}
        <div className="profile-main profile-main--full">
          <div className="profile-content">
            <div className="profile-header">
              <div>
                <h1>Profile Information</h1>
                <p className="profile-subtitle">{user.email}</p>
              </div>
              <div className="profile-header-actions">
                {!editing && (
                  <button className="btn btn-outline" onClick={() => setEditing(true)}>
                    Edit Profile
                  </button>
                )}
                <button className="btn btn-outline logout-btn" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </div>

            {error && <div className="profile-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}

            {editing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="disabled"
                  />
                  <small className="text-muted">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        city: user?.location?.city || "",
                      });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="profile-detail-item">
                  <label>Full Name</label>
                  <p>{user.name}</p>
                </div>

                <div className="profile-detail-item">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>

                <div className="profile-detail-item">
                  <label>Phone Number</label>
                  <p>{user.phone || <span className="text-muted">Not provided</span>}</p>
                </div>

                <div className="profile-detail-item">
                  <label>City</label>
                  <p>{user.location?.city || <span className="text-muted">Not provided</span>}</p>
                </div>

                <div className="profile-detail-item">
                  <label>Account Type</label>
                  <p>
                    <span className={`badge badge-${user.role === 'admin' ? 'live' : user.role === 'organizer' ? 'gold' : 'accent'}`}>
                      {user.role}
                    </span>
                  </p>
                </div>

                <div className="profile-detail-item">
                  <label>Member Since</label>
                  <p>{new Date(user.createdAt).toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
