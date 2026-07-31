import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3>About <span>PLAYZONE</span></h3>
          <p>
            India's premier e-sports tournament platform. Battle in BGMI, PUBG, COD & Free Fire 
            with real cash prizes. Built by gamers, for champions who demand excellence.
          </p>
          <p>
            Join thousands of competitive gamers and start your journey to e-sports glory today.
          </p>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/tournaments" className="footer-link">Tournaments</Link>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/contact" className="footer-link">Contact</Link>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </div>

        {/* Games Section */}
        <div className="footer-section">
          <h3>Tournaments</h3>
          <Link to="/tournaments" className="footer-link">BGMI Tournaments</Link>
          <Link to="/tournaments" className="footer-link">PUBG Mobile</Link>
          <Link to="/tournaments" className="footer-link">Call of Duty</Link>
          <Link to="/tournaments" className="footer-link">Free Fire</Link>
          <Link to="/tournaments" className="footer-link">View All Games</Link>
        </div>

        {/* Support Section */}
        <div className="footer-section">
          <h3>Support</h3>
          <p>📍 Mumbai, India</p>
          <p>
            📧 Email:{" "}
            <a
              href={`mailto:${process.env.REACT_APP_EMAIL}`}
              className="footer-email"
            >
              {process.env.REACT_APP_EMAIL}
</a>
          </p>
          <p>⏰ Support: 24/7 Available</p>
          <p>⚡ Response Time: Within 30 minutes</p>
          <Link to="/contact" className="footer-link" style={{ marginTop: "10px" }}>
            Report an Issue
          </Link>
        </div>
      </div>

      <div className="footer-copyright">
        <p>© {new Date().getFullYear()} <span>PLAYZONE</span>. All rights reserved. | Built for Champions</p>
      </div>
    </footer>
  );
}