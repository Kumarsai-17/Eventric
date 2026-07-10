import { Link } from "react-router-dom";
import "../styles/notFound.css";

const NotFound = () => (
  <div className="not-found">
    <span className="not-found__code mono">404</span>
    <h1>This ticket doesn't exist</h1>
    <p className="text-muted">The page you're looking for has been scanned out or never existed.</p>
    <Link to="/" className="btn btn-primary">
      Back to Eventric
    </Link>
  </div>
);

export default NotFound;
