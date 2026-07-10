import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LocationSelector from "../components/LocationSelector";
import { updateProfile } from "../services/authService";
import "../styles/auth.css";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const { register, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      
      // Show location selector after successful registration
      // Always show for new users since they won't have a city set
      setShowLocationSelector(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
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
          <h1>Create your account</h1>
          <p className="text-muted auth-card__subtitle">Book seats, collect verified tickets, resell fairly.</p>

          {error && <div className="auth-error">{error}</div>}

          <label>
            Full name
            <input name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe" />
          </label>
          <label>
            Email
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </label>
          <label>
            Password
            <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
          </label>

          <button className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
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

export default Register;
