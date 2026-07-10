import { useEffect, useMemo, useState } from "react";
import { getSocket } from "../services/socket";
import "../styles/seatMap.css";

// Interactive live seat grid. Reflects server-pushed lock/release/booked
// events instantly so two people never see stale availability.
const SeatMap = ({ eventId, seats, selectedSeats, onToggleSeat, mySocketId }) => {
  const [liveSeats, setLiveSeats] = useState(seats);

  useEffect(() => setLiveSeats(seats), [seats]);

  useEffect(() => {
    const socket = getSocket();

    const handleHeld = ({ seatId, holderSocketId }) => {
      setLiveSeats((prev) =>
        prev.map((s) => (s.seatId === seatId ? { ...s, status: "locked", holderSocketId } : s))
      );
    };
    const handleReleased = ({ seatId }) => {
      setLiveSeats((prev) => prev.map((s) => (s.seatId === seatId ? { ...s, status: "available" } : s)));
    };
    const handleBooked = ({ seatIds }) => {
      setLiveSeats((prev) => prev.map((s) => (seatIds.includes(s.seatId) ? { ...s, status: "booked" } : s)));
    };

    socket.on("seat:held", handleHeld);
    socket.on("seat:released", handleReleased);
    socket.on("seats:booked", handleBooked);

    return () => {
      socket.off("seat:held", handleHeld);
      socket.off("seat:released", handleReleased);
      socket.off("seats:booked", handleBooked);
    };
  }, []);

  const columns = useMemo(() => {
    const grouped = {};
    liveSeats.forEach((seat) => {
      const colKey = seat.number; // Use seat number as column
      grouped[colKey] = grouped[colKey] || [];
      grouped[colKey].push(seat);
    });
    // Sort columns by number
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([colNum, colSeats]) => [
        colNum,
        colSeats.sort((a, b) => a.row.localeCompare(b.row)) // Sort rows within each column
      ]);
  }, [liveSeats]);

  const seatClass = (seat) => {
    if (selectedSeats.includes(seat.seatId)) return "seat seat--selected";
    if (seat.status === "booked") return "seat seat--booked";
    if (seat.status === "locked" && seat.holderSocketId !== mySocketId) return "seat seat--locked";
    if (seat.status === "locked") return "seat seat--selected";
    return `seat seat--${seat.tier}`;
  };

  return (
    <div className="seat-map">
      <div className="seat-map__stage">STAGE</div>

      <div className="seat-map__grid">
        {columns.map(([colNum, colSeats]) => (
          <div className="seat-map__row" key={colNum}>
            <span className="seat-map__row-label mono">{colNum}</span>
            {colSeats.map((seat) => (
              <button
                key={seat.seatId}
                className={seatClass(seat)}
                disabled={seat.status === "booked" || (seat.status === "locked" && seat.holderSocketId !== mySocketId)}
                onClick={() => onToggleSeat(seat)}
                title={`${seat.seatId} · ${seat.tier} · ₹${seat.price}`}
              >
                {seat.row}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="seat-map__legend">
        <span>
          <i className="seat-map__swatch seat-map__swatch--available" /> Available
        </span>
        <span>
          <i className="seat-map__swatch seat-map__swatch--selected" /> Selected
        </span>
        <span>
          <i className="seat-map__swatch seat-map__swatch--locked" /> Held by someone
        </span>
        <span>
          <i className="seat-map__swatch seat-map__swatch--booked" /> Booked
        </span>
      </div>
    </div>
  );
};

export default SeatMap;
