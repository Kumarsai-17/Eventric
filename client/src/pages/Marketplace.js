import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchResaleListings, createResaleOrder, confirmResalePurchase } from "../services/resaleService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { loadMockRazorpay } from "../utils/mockPayment";
import "../styles/marketplace.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Load Razorpay script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    const params = {};
    
    // Filter by user's city if available
    if (user?.location?.city) {
      params.city = user.location.city;
    }
    
    fetchResaleListings(params)
      .then((data) => setListings(data.listings))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  const handleBuy = async (listing) => {
    setMessage("");
    setProcessing(true);
    
    try {
      // Step 1: Create payment order
      const { order, paymentId, key, isMockPayment, resale } = await createResaleOrder(listing._id);

      // Step 2: Load appropriate payment script
      let scriptLoaded;
      if (isMockPayment) {
        console.log("[Marketplace] Using mock payment gateway for resale");
        scriptLoaded = await loadMockRazorpay();
      } else {
        scriptLoaded = await loadRazorpayScript();
      }

      if (!scriptLoaded) {
        throw new Error("Unable to load payment gateway. Check your connection.");
      }

      // Step 3: Open payment modal
      const razorpayOptions = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Eventric Resale",
        description: `${resale.eventTitle} — Seat ${resale.seatId}`,
        order_id: order.id,
        theme: { color: "#8b5cf6" },
        prefill: { name: user?.name, email: user?.email },
        handler: async (response) => {
          try {
            // Step 4: Verify payment and confirm purchase
            const result = await confirmResalePurchase(listing._id, {
              paymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            setMessage(`✅ Purchase successful! Seat ${resale.seatId} is now yours. Check My Tickets for your QR code.`);
            
            // Navigate to My Tickets after a moment
            setTimeout(() => {
              navigate("/my-tickets", { state: { justBooked: result.booking._id } });
            }, 2000);
            
            load(); // Refresh listings
          } catch (err) {
            setMessage(err.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setMessage("Payment cancelled. The ticket is still available.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(razorpayOptions);
      razorpayInstance.open();
      
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to start payment process. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="container section marketplace">
      <div>
        <h1>Resale Marketplace</h1>
        <p className="text-muted">
          Genuine tickets, resold below or at face value. Every purchase transfers ownership and issues a brand-new
          QR code.
        </p>
      </div>

      {message && <div className="my-tickets__toast">{message}</div>}

      {loading ? (
        <LoadingSpinner label="Loading listings" />
      ) : listings.length === 0 ? (
        <p className="text-muted" style={{ padding: "48px 0", textAlign: "center" }}>
          No resale tickets available right now.
        </p>
      ) : (
        <div className="marketplace__grid">
          {listings.map((listing) => {
            const discount = Math.round(((listing.originalPrice - listing.resalePrice) / listing.originalPrice) * 100);
            return (
              <div key={listing._id} className="marketplace__card ticket-stub">
                <div className="marketplace__card-body">
                  <h3>{listing.event?.title}</h3>
                  <p className="text-muted mono">
                    {formatDate(listing.event?.startDateTime)} · {listing.event?.venue?.city}
                  </p>
                  <p className="marketplace__seat mono">Seat {listing.seatId}</p>
                  <p className="text-muted" style={{ fontSize: "0.8rem" }}>Sold by {listing.seller?.name}</p>
                </div>

                <div className="ticket-stub__tear" />

                <div className="marketplace__card-footer">
                  <div>
                    <span className="marketplace__price">₹{listing.resalePrice}</span>
                    <span className="marketplace__original">₹{listing.originalPrice}</span>
                    {discount > 0 && <span className="badge badge-accent">-{discount}%</span>}
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleBuy(listing)}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Buy ticket"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
