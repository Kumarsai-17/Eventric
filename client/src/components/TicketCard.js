import { useState, useRef, useEffect } from "react";
import { cancelResaleListing } from "../services/resaleService";
import "../styles/ticketCard.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const TicketCard = ({ booking, onResell, onCancel, onViewDetails, isResale = false, resaleListings = [] }) => {
  const [resalePrice, setResalePrice] = useState("");
  const [showResaleForm, setShowResaleForm] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const menuRef = useRef(null);

  const seatPrice = (seatId) => booking.seats.find((s) => s.seatId === seatId)?.price || 0;

  // Check if a specific seat is listed for resale
  const isSeatListed = (seatId) => {
    return resaleListings.some(listing => listing.seatId === seatId);
  };

  // Get resale listing for a specific seat
  const getResaleListing = (seatId) => {
    return resaleListings.find(listing => listing.seatId === seatId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResellClick = () => {
    setShowMenu(false);
    
    // Check if event data exists
    if (!booking.event?.startDateTime) {
      setLocalMessage("Event data is not available");
      setTimeout(() => setLocalMessage(""), 3000);
      return;
    }
    
    // Check time restrictions
    const now = new Date();
    const eventStart = new Date(booking.event.startDateTime);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

    if (eventStart < now) {
      setLocalMessage("Cannot list tickets for past events");
      setTimeout(() => setLocalMessage(""), 3000);
      return;
    }

    if (hoursUntilEvent < 24) {
      setLocalMessage("Cannot list tickets within 24 hours of event start");
      setTimeout(() => setLocalMessage(""), 3000);
      return;
    }

    // Show resale form for first non-listed seat
    const availableSeat = booking.seats.find(s => !isSeatListed(s.seatId));
    if (availableSeat) {
      setShowResaleForm(availableSeat.seatId);
    } else {
      setLocalMessage("All seats are already listed for resale");
      setTimeout(() => setLocalMessage(""), 3000);
    }
  };

  const handleCancelResale = async (seatId) => {
    setShowMenu(false);
    const listing = getResaleListing(seatId);
    if (!listing) return;

    // Check if event data exists
    if (!booking.event?.startDateTime) {
      setLocalMessage("Event data is not available");
      setTimeout(() => setLocalMessage(""), 3000);
      return;
    }

    // Check time restrictions
    const now = new Date();
    const eventStart = new Date(booking.event.startDateTime);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

    if (eventStart < now) {
      setLocalMessage("Cannot cancel listings for past events");
      setTimeout(() => setLocalMessage(""), 3000);
      return;
    }

    if (hoursUntilEvent < 12) {
      setLocalMessage("Cannot cancel resale listing within 12 hours of event start");
      setTimeout(() => setLocalMessage(""), 3000);
      return;
    }

    try {
      await cancelResaleListing(listing._id);
      setLocalMessage(`Resale listing for ${seatId} cancelled`);
      setTimeout(() => {
        setLocalMessage("");
        window.location.reload(); // Refresh to update the lists
      }, 1500);
    } catch (error) {
      setLocalMessage(error.response?.data?.message || "Failed to cancel listing");
      setTimeout(() => setLocalMessage(""), 3000);
    }
  };

  // Check if resale is allowed based on time
  const canResell = () => {
    if (!booking.event?.startDateTime) return false;
    const now = new Date();
    const eventStart = new Date(booking.event.startDateTime);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
    return eventStart > now && hoursUntilEvent >= 24;
  };

  // Check if cancellation is allowed based on time
  const canCancelTicket = () => {
    if (!booking.event?.startDateTime || !booking.createdAt) return false;
    const now = new Date();
    const eventStart = new Date(booking.event.startDateTime);
    const bookingDate = new Date(booking.createdAt);
    const hoursSinceBooking = (now - bookingDate) / (1000 * 60 * 60);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
    return eventStart > now && hoursSinceBooking <= 48 && hoursUntilEvent >= 72;
  };

  const handleCancelClick = () => {
    setShowMenu(false);
    onCancel(booking);
  };

  const handleViewDetails = () => {
    setShowMenu(false);
    onViewDetails(booking);
  };

  return (
    <div className="ticket-card ticket-stub">
      {localMessage && (
        <div className="ticket-card__message">
          {localMessage}
        </div>
      )}
      
      <div className="ticket-card__top">
        <div className="ticket-card__info" onClick={handleViewDetails} style={{cursor: 'pointer', flex: 1}}>
          <h3>{booking.event?.title}</h3>
          <div className="ticket-card__details">
            <div className="ticket-card__detail-item">
              <span className="ticket-card__detail-icon">📍</span>
              <span className="ticket-card__detail-text">{booking.event?.venue?.name}, {booking.event?.venue?.city}</span>
            </div>
            <div className="ticket-card__detail-item">
              <span className="ticket-card__detail-icon">📅</span>
              <span className="ticket-card__detail-text">
                {new Date(booking.event?.startDateTime).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="ticket-card__detail-item">
              <span className="ticket-card__detail-icon">🕐</span>
              <span className="ticket-card__detail-text">
                {new Date(booking.event?.startDateTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="ticket-card__header-actions">
          <span className={`badge ${booking.checkedIn ? "badge-muted" : isResale ? "badge-gold" : "badge-accent"}`}>
            {booking.checkedIn ? "Used" : isResale ? "On Sale" : "Valid"}
          </span>
          
          {/* 3-Dot Menu */}
          <div className="ticket-card__menu" ref={menuRef}>
            <button 
              className="ticket-card__menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              ⋮
            </button>
            
            {showMenu && (
              <div className="ticket-card__menu-dropdown">
                <button className="ticket-card__menu-item" onClick={handleViewDetails}>
                  <span className="ticket-card__menu-icon">📋</span>
                  View Details
                </button>
                
                {!booking.checkedIn && !isResale && (
                  <button 
                    className="ticket-card__menu-item" 
                    onClick={handleResellClick}
                    disabled={!canResell()}
                    style={{opacity: canResell() ? 1 : 0.5, cursor: canResell() ? 'pointer' : 'not-allowed'}}
                    title={!canResell() ? "Cannot list tickets within 24 hours of event" : ""}
                  >
                    <span className="ticket-card__menu-icon">💰</span>
                    List for Resale
                  </button>
                )}

                {isResale && resaleListings.length > 0 && (
                  <button className="ticket-card__menu-item" onClick={() => {
                    setShowMenu(false);
                    // Show options to cancel specific seat listings
                    const seatId = resaleListings[0].seatId;
                    handleCancelResale(seatId);
                  }}>
                    <span className="ticket-card__menu-icon">❌</span>
                    Cancel Resale Listing
                  </button>
                )}
                
                {!booking.checkedIn && !isResale && (
                  <button 
                    className="ticket-card__menu-item ticket-card__menu-item--danger" 
                    onClick={handleCancelClick}
                    disabled={!canCancelTicket()}
                    style={{opacity: canCancelTicket() ? 1 : 0.5, cursor: canCancelTicket() ? 'pointer' : 'not-allowed'}}
                    title={!canCancelTicket() ? "Cancellation window expired or too close to event" : ""}
                  >
                    <span className="ticket-card__menu-icon">🗑️</span>
                    Cancel Ticket
                  </button>
                )}
                
                <button className="ticket-card__menu-item" onClick={() => {
                  navigator.clipboard.writeText(booking._id);
                  setShowMenu(false);
                  setLocalMessage("Booking ID copied!");
                  setTimeout(() => setLocalMessage(""), 2000);
                }}>
                  <span className="ticket-card__menu-icon">📄</span>
                  Copy Booking ID
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ticket-card__seats">
        {booking.seats.map((s) => {
          const listing = getResaleListing(s.seatId);
          const isListed = isSeatListed(s.seatId);
          return (
            <span 
              key={s.seatId} 
              className={`badge ${isListed ? "badge-gold" : "badge-accent"} mono`}
              style={{position: 'relative'}}
            >
              {s.seatId} · ₹{isListed && listing ? listing.resalePrice : s.price}
              {isListed && (
                <span style={{fontSize: '0.7em', marginLeft: '4px'}}>(Listed)</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Conditionally render tear line and bottom section */}
      {showResaleForm ? (
        /* When resale form is shown, display it without QR and without tear line */
        <div style={{marginTop: 'var(--space-5)'}}>
          <div className="ticket-card__resale-form">
            <label>Set resale price for {showResaleForm}</label>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px'}}>
              <input
                type="number"
                placeholder={`Max ₹${seatPrice(showResaleForm)}`}
                max={seatPrice(showResaleForm)}
                value={resalePrice}
                onChange={(e) => setResalePrice(e.target.value)}
                style={{flex: '1 1 140px', minWidth: '120px'}}
              />
              <button
                className="btn btn-accent"
                onClick={() => {
                  onResell(booking, showResaleForm, Number(resalePrice));
                  setShowResaleForm(null);
                  setResalePrice("");
                }}
                disabled={!resalePrice || Number(resalePrice) > seatPrice(showResaleForm)}
                style={{flex: '0 0 auto'}}
              >
                List Now
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowResaleForm(null)}
                style={{flex: '0 0 auto'}}
              >
                Cancel
              </button>
            </div>
            <small style={{color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px', display: 'block'}}>
              Maximum allowed: ₹{seatPrice(showResaleForm)}
            </small>
          </div>
        </div>
      ) : (
        /* Normal view with tear line, QR, and description */
        <>
          <div className="ticket-stub__tear" />
          <div className="ticket-card__bottom">
            <img 
              src={booking.qrCode?.image} 
              alt="Ticket QR code" 
              className="ticket-card__qr"
              onClick={handleViewDetails}
              style={{cursor: 'pointer'}}
            />
            <div className="ticket-card__actions">
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                {isResale 
                  ? `${resaleListings.length} seat${resaleListings.length > 1 ? 's' : ''} listed on marketplace. You'll be notified when sold.`
                  : "Present the QR code at entry. Tap to view full details."
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketCard;
