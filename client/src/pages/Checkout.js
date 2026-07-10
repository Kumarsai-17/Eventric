import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { createPaymentOrder, verifyPayment, confirmBooking, unlockSeats } from "../services/bookingService";
import { fetchEventById } from "../services/eventService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { loadMockRazorpay } from "../utils/mockPayment";
import "../styles/checkout.css";

// Dynamically loads the Razorpay checkout script once
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { id: eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { seatIds = [], total = 0 } = location.state || {};

  const [event, setEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (seatIds.length === 0) navigate(`/events/${eventId}`);
    fetchEventById(eventId).then((data) => setEvent(data.event));
  }, [eventId, navigate, seatIds.length]);

  const handleCancel = async () => {
    await unlockSeats({ eventId, seatIds }).catch(() => {});
    navigate(`/events/${eventId}`);
  };

  const handlePay = async () => {
    setError("");
    setProcessing(true);
    try {
      const { order, paymentId, key, isMockPayment } = await createPaymentOrder(total);

      // Load appropriate payment script
      let scriptLoaded;
      if (isMockPayment) {
        console.log("[Checkout] Using mock payment gateway");
        scriptLoaded = await loadMockRazorpay();
      } else {
        scriptLoaded = await loadRazorpayScript();
      }

      if (!scriptLoaded) throw new Error("Unable to load payment gateway. Check your connection.");

      const razorpayOptions = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Eventric",
        description: `${event?.title} — ${seatIds.join(", ")}`,
        order_id: order.id,
        theme: { color: "#7c5cfc" },
        prefill: { name: user?.name, email: user?.email },
        handler: async (response) => {
          try {
            await verifyPayment({
              paymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const { booking } = await confirmBooking({ eventId, seatIds, paymentId });
            navigate("/my-tickets", { state: { justBooked: booking._id } });
          } catch (err) {
            setError(err.response?.data?.message || "Payment verification failed.");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      };

      const razorpayInstance = new window.Razorpay(razorpayOptions);
      razorpayInstance.open();
    } catch (err) {
      setError(err.message || "Something went wrong starting the payment.");
      setProcessing(false);
    }
  };

  if (!event) return <LoadingSpinner label="Preparing checkout" />;

  return (
    <div className="container section checkout">
      <h1>Confirm your tickets</h1>
      <div className="checkout-card ticket-stub">
        <h3>{event.title}</h3>
        <div className="checkout-event-info">
          <div className="checkout-info-row">
            <span className="checkout-info-label">📍 Location</span>
            <span className="checkout-info-value">{event.venue.name}, {event.venue.city}</span>
          </div>
          <div className="checkout-info-row">
            <span className="checkout-info-label">📅 Date</span>
            <span className="checkout-info-value">
              {new Date(event.startDateTime).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </span>
          </div>
          <div className="checkout-info-row">
            <span className="checkout-info-label">🕐 Time</span>
            <span className="checkout-info-value">
              {new Date(event.startDateTime).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}
            </span>
          </div>
          <div className="checkout-info-row">
            <span className="checkout-info-label">🎭 Category</span>
            <span className="checkout-info-value">{event.category}</span>
          </div>
        </div>

        <ul className="checkout-seats">
          {seatIds.map((seatId) => {
            const seat = event.seats.find((s) => s.seatId === seatId);
            return (
              <li key={seatId}>
                <span className="mono">{seatId}</span>
                <span className="badge badge-gold">{seat?.tier}</span>
                <span>₹{seat?.price}</span>
              </li>
            );
          })}
        </ul>

        <div className="ticket-stub__tear" />

        <div className="checkout-total">
          <span>Total payable</span>
          <strong>₹{total}</strong>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="checkout-actions">
          <button className="btn btn-outline" onClick={handleCancel} disabled={processing}>
            Cancel &amp; release seats
          </button>
          <button className="btn btn-primary" onClick={handlePay} disabled={processing}>
            {processing ? "Processing..." : `Pay ₹${total} securely`}
          </button>
        </div>
        <p className="checkout-note text-muted">
          Seats are held for you temporarily. If checkout isn't completed in time, they'll automatically release
          back to the pool.
        </p>
      </div>
    </div>
  );
};

export default Checkout;
