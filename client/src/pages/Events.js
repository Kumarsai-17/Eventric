import { useEffect, useState } from "react";
import { fetchEvents } from "../services/eventService";
import EventCard from "../components/EventCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import "../styles/events.css";

const CATEGORIES = ["all", "movies", "music", "sports", "comedy", "festival", "other", "conference"];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category !== "all") params.category = category;
    
    // Add user's city for location-based filtering
    if (user?.location?.city) {
      params.city = user.location.city;
    }

    const timeout = setTimeout(() => {
      fetchEvents(params)
        .then((data) => setEvents(data.events))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category, user]);

  return (
    <div className="container section events-page">
      <div className="events-header">
        <h1>Browse events</h1>
        <input
          className="events-search"
          placeholder="Search by name, city, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="events-filters">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`events-filter ${category === c ? "is-active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching events" />
      ) : events.length === 0 ? (
        <div className="events-empty">
          <div className="events-empty-icon">🎭</div>
          <h3>No events found</h3>
          <p className="text-muted">
            {user?.location?.city 
              ? `No events in ${user.location.city} match your search. Try a different category.`
              : "No events match your search. Try a different search term or category."}
          </p>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
