import { Link } from "react-router-dom";
import "../styles/eventCard.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const EventCard = ({ event }) => {
  const soldOut = event.seatsAvailable === 0;
  const lowStock = !soldOut && event.seatsAvailable <= event.totalSeats * 0.1;
  const minPrice = event.seats?.length ? Math.min(...event.seats.map((s) => s.price)) : null;

  return (
    <Link to={`/events/${event._id}`} className="event-card ticket-stub">
      <div className="event-card__image">
        {event.coverImage?.url ? (
          <img src={event.coverImage.url} alt={event.title} />
        ) : (
          <div className="event-card__image-fallback">{event.title.slice(0, 2).toUpperCase()}</div>
        )}
        <span className="badge badge-accent event-card__category">{event.category}</span>
        {soldOut && <span className="badge badge-live event-card__soldout">Sold out</span>}
        {lowStock && !soldOut && <span className="badge badge-gold event-card__soldout">Almost gone</span>}
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>
        <p className="event-card__venue">
          {event.venue?.name} · {event.venue?.city}
        </p>
      </div>

      <div className="ticket-stub__tear" />

      <div className="event-card__footer">
        <div>
          <span className="event-card__date mono">{formatDate(event.startDateTime)}</span>
          <span className="event-card__time mono">{formatTime(event.startDateTime)}</span>
        </div>
        {minPrice !== null && (
          <div className="event-card__price">
            <span className="text-muted">from</span> ₹{minPrice}
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;
