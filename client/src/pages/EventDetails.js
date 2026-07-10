import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchEventById } from "../services/eventService";
import { useAuth } from "../context/AuthContext";
import { getSocket, connectSocket } from "../services/socket";
import SeatMap from "../components/SeatMap";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/eventDetails.css";

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const socket = getSocket();

  useEffect(() => {
    fetchEventById(id)
      .then((data) => setEvent(data.event))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    connectSocket();
    socket.emit("event:join", id);
    return () => socket.emit("event:leave", id);
  }, [id, socket]);

  const handleToggleSeat = useCallback(
    (seat) => {
      if (!user) {
        navigate("/login", { state: { from: `/events/${id}` } });
        return;
      }

      const isSelected = selectedSeats.includes(seat.seatId);
      
      if (isSelected) {
        // Deselect the seat
        socket.emit("seat:release", { eventId: id, seatId: seat.seatId });
        setSelectedSeats((prev) => prev.filter((s) => s !== seat.seatId));
      } else {
        // Allow selecting multiple seats
        if (seat.status !== "available") {
          return;
        }
        
        // Add the new seat to selection
        socket.emit("seat:hold", { eventId: id, seatId: seat.seatId });
        setSelectedSeats((prev) => [...prev, seat.seatId]); // Add to existing selection
      }
    },
    [id, navigate, selectedSeats, socket, user]
  );

  // Calculate total - must be before early returns (React Hooks rules)
  const selectedTotal = useMemo(() => {
    if (!event || !event.seats) return 0;
    const total = event.seats
      .filter((s) => selectedSeats.includes(s.seatId))
      .reduce((sum, s) => sum + (s.price || 0), 0);
    return total;
  }, [event, selectedSeats]);

  if (loading) return <LoadingSpinner label="Loading event" />;
  if (!event) return <p className="container section">Event not found.</p>;

  return (
    <div className="container section event-details">
      <div className="event-details__header">
        <div>
          <span className="badge badge-accent">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="event-details__venue">
            {event.venue.name}, {event.venue.address}, {event.venue.city}
          </p>
          <p className="mono text-muted">{formatDateTime(event.startDateTime)}</p>
        </div>
        {event.coverImage?.url && <img src={event.coverImage.url} alt={event.title} className="event-details__cover" />}
      </div>

      <p className="event-details__description">{event.description}</p>

      <div className="event-details__layout">
        <div className="event-details__seat-container">
          <SeatMap
            eventId={id}
            seats={event.seats}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            mySocketId={socket.id}
          />
        </div>

        <aside className="event-details__summary">
          <h3>Your selection</h3>
          
          {selectedSeats.length === 0 ? (
            <p className="event-details__summary-empty">Select seats from the map above</p>
          ) : (
            <ul className="event-details__selected-list">
              {selectedSeats.map((seatId) => {
                const seat = event.seats.find((s) => s.seatId === seatId);
                return (
                  <li key={seatId}>
                    <span className="mono">{seatId}</span>
                    <span>₹{seat?.price || 0}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="event-details__summary-actions">
            <div className="event-details__total">
              <span>Total</span>
              <strong>₹{selectedTotal}</strong>
            </div>

            <button
              className="btn btn-primary event-details__checkout"
              disabled={selectedSeats.length === 0}
              onClick={() => navigate(`/checkout/${id}`, { state: { seatIds: selectedSeats, total: selectedTotal } })}
            >
              Continue to checkout →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EventDetails;
