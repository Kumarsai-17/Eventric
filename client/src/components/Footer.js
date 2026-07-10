import { Link } from "react-router-dom";
import "../styles/footer.css";

const Footer = () => (
  <footer className="footer">
    <div className="container footer__inner">
      <div>
        <div className="footer__brand">Eventric</div>
        <p className="footer__tag">Live seats. Verified tickets. No fakes at the door.</p>
      </div>
      <div className="footer__links">
        <Link to="/events">Events</Link>
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/my-tickets">My Tickets</Link>
      </div>
      <p className="footer__meta mono">© {new Date().getFullYear()} Eventric — built on the MERN stack</p>
    </div>
  </footer>
);

export default Footer;
