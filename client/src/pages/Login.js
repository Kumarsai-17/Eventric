import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LocationSelector from "../components/LocationSelector";
import { updateProfile } from "../services/authService";
import "../styles/auth.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form);
      
      // Show location selector if user hasn't set a city yet
      if (!user.location?.city || user.location.city.trim() === "") {
        setShowLocationSelector(true);
      } else {
        navigate("/events");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (city) => {
    try {
      const { user } = await updateProfile({ city });
      updateUser(user);
      navigate("/events");
    } catch (err) {
      console.error("Error updating location:", err);
      navigate("/events");
    }
  };

  const handleLocationSkip = () => {
    navigate("/events");
  };

  return (
    <>
      <div className="auth-page">
        <form className="auth-card ticket-stub" onSubmit={handleSubmit}>
          <h1>Welcome back</h1>
          <p className="text-muted auth-card__subtitle">Log in to manage your tickets and bookings.</p>

          {error && <div className="auth-error">{error}</div>}

          <label>
            Email
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
          </label>

          <button className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="auth-switch">
            New to Eventric? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>

      {showLocationSelector && (
        <LocationSelector 
          onSelect={handleLocationSelect} 
          onSkip={handleLocationSkip}
        />
      )}
    </>
  );
};

export default Login;
