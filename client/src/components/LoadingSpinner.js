import "../styles/loading.css";

const LoadingSpinner = ({ label = "Loading" }) => (
  <div className="loading-wrap" role="status" aria-live="polite">
    <span className="loading-ring" />
    <span className="loading-label">{label}</span>
  </div>
);

export default LoadingSpinner;
