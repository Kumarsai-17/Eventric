import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LocationSelector from "./LocationSelector";
import NotificationBell from "./NotificationBell";
import { updateProfile } from "../services/authService";
import "../styles/navbar.css";

const Navbar = () => {
  const { user, logout, updateUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    navigate("/");
  };

  const handleLocationChange = () => {
    setShowLocationSelector(true);
  };

  const handleLocationSelect = async (city) => {
    try {
      const { user: updatedUser } = await updateProfile({ city });
      updateUser(updatedUser);
      setShowLocationSelector(false);
    } catch (err) {
      console.error("Error updating location:", err);
      setShowLocationSelector(false);
    }
  };

  const handleLocationSkip = () => {
    setShowLocationSelector(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    const names = user.name.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get user city
  const getUserCity = () => {
    if (user && user.location && user.location.city) {
      return user.location.city;
    }
    return null;
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar__inner">
          <Link to="/" className="navbar__brand">
            <div className="navbar__logo">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="url(#logo-gradient)"/>
                <path d="M12 15L20 10L28 15V25L20 30L12 25V15Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="20" cy="20" r="4" fill="white"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8B5CF6"/>
                    <stop offset="1" stopColor="#6D28D9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="navbar__brand-name">Eventric</span>
          </Link>

          <nav className={`navbar__links ${menuOpen ? "is-open" : ""}`}>
            <NavLink to="/events" onClick={() => setMenuOpen(false)}>
              Events
            </NavLink>
            <NavLink to="/marketplace" onClick={() => setMenuOpen(false)}>
              Marketplace
            </NavLink>
            {user?.role === "organizer" && (
              <NavLink to="/create-event" onClick={() => setMenuOpen(false)}>
                Host an Event
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="navbar__actions">
            {user ? (
              <>
                {/* Location Selector Button */}
                <button className="navbar__location" onClick={handleLocationChange}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 7C8.10457 7 9 6.10457 9 5C9 3.89543 8.10457 3 7 3C5.89543 3 5 3.89543 5 5C5 6.10457 5.89543 7 7 7Z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 12C7 12 11 9 11 5.5C11 3.01472 9.20914 1 7 1C4.79086 1 3 3.01472 3 5.5C3 9 7 12 7 12Z" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  <span>{getUserCity() || "Select city"}</span>
                  <svg className="navbar__location-arrow" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Avatar */}
                <div className="navbar__profile" ref={profileRef}>
                  <button 
                    className="navbar__avatar" 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    aria-label="User menu"
                  >
                    <span className="navbar__avatar-initials">{getUserInitials()}</span>
                    <svg className="navbar__avatar-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {profileMenuOpen && (
                    <div className="navbar__dropdown">
                      <div className="navbar__dropdown-header">
                        <div className="navbar__dropdown-avatar">{getUserInitials()}</div>
                        <div className="navbar__dropdown-info">
                          <div className="navbar__dropdown-name">{user.name}</div>
                          <div className="navbar__dropdown-email">{user.email}</div>
                        </div>
                      </div>
                      <div className="navbar__dropdown-divider"></div>
                      <Link 
                        to="/profile" 
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="navbar__dropdown-item"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M3 14C3 11.7909 5.23858 10 8 10C10.7614 10 13 11.7909 13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Profile
                      </Link>
                      <Link 
                        to="/my-tickets" 
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="navbar__dropdown-item"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                        </svg>
                        My Tickets
                      </Link>
                      <div className="navbar__dropdown-divider"></div>
                      <button 
                        onClick={handleLogout}
                        className="navbar__dropdown-item navbar__dropdown-item-danger"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M11 11L14 8M14 8L11 5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
            <button className="navbar__burger" aria-label="Toggle menu" onClick={() => setMenuOpen((o) => !o)}>
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelector 
          onSelect={handleLocationSelect} 
          onSkip={handleLocationSkip}
        />
      )}
    </>
  );
};

export default Navbar;
