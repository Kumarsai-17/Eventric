import { useEffect, useState } from "react";
import { fetchMyBookings, cancelBooking } from "../services/bookingService";
import { listTicketForResale, fetchResaleListings } from "../services/resaleService";
import { useAuth } from "../context/AuthContext";
import TicketCard from "../components/TicketCard";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/myTickets.css";

const MyTickets = () => {
  const [bookings, setBookings] = useState([]);
  const [resaleListings, setResaleListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "resale"
  const { user } = useAuth();

  const loadBookings = async () => {
    setLoading(true);
    try {
      const bookingData = await fetchMyBookings();
      setBookings(bookingData.bookings);
      
      // Fetch only current user's resale listings
      if (user?._id) {
        const resaleData = await fetchResaleListings({ sellerId: user._id });
        setResaleListings(resaleData.listings || []);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const handleResell = async (booking, seatId, resalePrice) => {
    setMessage("");
    try {
      const result = await listTicketForResale({ bookingId: booking._id, seatId, resalePrice });
      setMessage(`✅ Seat ${seatId} listed for resale at ₹${resalePrice}.`);
      
      // Reload bookings to reflect changes
      setTimeout(() => {
        loadBookings();
        setMessage("");
      }, 2000);
    } catch (err) {
      console.error("Resale error:", err);
      setMessage(`❌ ${err.response?.data?.message || "Could not list this seat for resale."}`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleCancelTicket = async (booking) => {
    // Check time restrictions before confirming
    const now = new Date();
    const eventStart = new Date(booking.event.startDateTime);
    const bookingDate = new Date(booking.createdAt);
    
    const hoursSinceBooking = (now - bookingDate) / (1000 * 60 * 60);
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

    if (hoursSinceBooking > 48) {
      setMessage("❌ Cancellation window expired. Tickets can only be cancelled within 48 hours of booking.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    if (hoursUntilEvent < 72) {
      setMessage("❌ Cannot cancel tickets within 72 hours of event start.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (eventStart < now) {
      setMessage("❌ Cannot cancel tickets for past events.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const result = await cancelBooking(booking._id);
      setMessage(`✅ ${result.message}`);
      // Immediately remove the cancelled booking from the list
      setBookings(prevBookings => prevBookings.filter(b => b._id !== booking._id));
      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || "Could not cancel this booking."}`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Helper function to check if a booking has any seats listed for resale
  const hasActiveResaleListing = (bookingId) => {
    return resaleListings.some(
      listing => String(listing.booking) === String(bookingId) && listing.status === "listed"
    );
  };

  // Separate active tickets (owned and not currently listed) and resale tickets (currently listed for sale)
  // Note: b.isResold means this ticket was purchased from resale market, but it's still an active ticket for the current owner
  const activeTickets = bookings.filter(b => !hasActiveResaleListing(b._id) && b.status !== "cancelled");
  const resaleTickets = bookings.filter(b => hasActiveResaleListing(b._id) && b.status !== "cancelled");

  return (
    <div className="container section my-tickets">
      <h1>My Tickets</h1>
      {message && <div className="my-tickets__toast">{message}</div>}

      {loading ? (
        <LoadingSpinner label="Fetching your tickets" />
      ) : bookings.length === 0 ? (
        <div className="my-tickets__empty">
          <div className="my-tickets__empty-icon">🎫</div>
          <h3>No tickets yet</h3>
          <p className="text-muted">Browse events and book your first ticket!</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="my-tickets__tabs">
            <button
              className={`my-tickets__tab ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active Tickets
              {activeTickets.length > 0 && (
                <span className="my-tickets__tab-count">{activeTickets.length}</span>
              )}
            </button>
            <button
              className={`my-tickets__tab ${activeTab === "resale" ? "active" : ""}`}
              onClick={() => setActiveTab("resale")}
            >
              Listed for Resale
              {resaleTickets.length > 0 && (
                <span className="my-tickets__tab-count">{resaleTickets.length}</span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="my-tickets__tab-content">
            {activeTab === "active" && (
              <div className="my-tickets__list">
                {activeTickets.length > 0 ? (
                  activeTickets.map((booking) => (
                    <TicketCard
                      key={booking._id}
                      booking={booking}
                      onResell={handleResell}
                      onCancel={handleCancelTicket}
                      onViewDetails={setSelectedTicket}
                      isResale={false}
                    />
                  ))
                ) : (
                  <div className="my-tickets__empty-state">
                    <p>No active tickets</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "resale" && (
              <div className="my-tickets__list">
                {resaleTickets.length > 0 ? (
                  resaleTickets.map((booking) => {
                    const activeListings = resaleListings.filter(
                      listing => String(listing.booking) === String(booking._id) && listing.status === "listed"
                    );
                    return (
                      <TicketCard
                        key={booking._id}
                        booking={booking}
                        onResell={handleResell}
                        onCancel={handleCancelTicket}
                        onViewDetails={setSelectedTicket}
                        isResale={true}
                        resaleListings={activeListings}
                      />
                    );
                  })
                ) : (
                  <div className="my-tickets__empty-state">
                    <p>No tickets listed for resale</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ticket-modal__close" onClick={() => setSelectedTicket(null)}>
              ✕
            </button>
            
            <h2>{selectedTicket.event?.title}</h2>
            
            <div className="ticket-modal__section">
              <h3>Event Details</h3>
              <div className="ticket-modal__details">
                <div className="ticket-modal__detail-row">
                  <span className="label">Venue</span>
                  <span className="value">{selectedTicket.event?.venue?.name}</span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Address</span>
                  <span className="value">{selectedTicket.event?.venue?.address}, {selectedTicket.event?.venue?.city}</span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Date & Time</span>
                  <span className="value">
                    {new Date(selectedTicket.event?.startDateTime).toLocaleString("en-IN", {
                      dateStyle: "full",
                      timeStyle: "short"
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="ticket-modal__section">
              <h3>Booking Details</h3>
              <div className="ticket-modal__details">
                <div className="ticket-modal__detail-row">
                  <span className="label">Booking ID</span>
                  <span className="value mono">{selectedTicket._id}</span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Status</span>
                  <span className={`badge ${selectedTicket.checkedIn ? "badge-muted" : "badge-accent"}`}>
                    {selectedTicket.checkedIn ? "Used" : "Valid"}
                  </span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Seats</span>
                  <span className="value">
                    {selectedTicket.seats.map(s => (
                      <span key={s.seatId} className="badge badge-gold mono" style={{marginRight: '8px'}}>
                        {s.seatId}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Booked On</span>
                  <span className="value">
                    {new Date(selectedTicket.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="ticket-modal__section">
              <h3>Payment Details</h3>
              <div className="ticket-modal__details">
                <div className="ticket-modal__detail-row">
                  <span className="label">Total Amount</span>
                  <span className="value ticket-modal__amount">₹{selectedTicket.totalAmount}</span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Payment Status</span>
                  <span className="badge badge-accent">Paid</span>
                </div>
                <div className="ticket-modal__detail-row">
                  <span className="label">Seats Breakdown</span>
                  <span className="value">
                    {selectedTicket.seats.map(s => (
                      <div key={s.seatId} style={{fontSize: '0.9rem', marginTop: '4px'}}>
                        {s.seatId}: ₹{s.price}
                      </div>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            <div className="ticket-modal__qr">
              <h3>Entry QR Code</h3>
              <img src={selectedTicket.qrCode?.image} alt="QR Code" />
              <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '12px'}}>
                Present this code at the venue entrance
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
