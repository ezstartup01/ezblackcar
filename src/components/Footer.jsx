import { Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { assets } from "../data/siteContent.js";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src={assets.logo} alt="EZ Black Car" />
        <p>Premium black car service for DTW and Metro Detroit. Reliable. Professional. On time.</p>
        <div className="social-links" aria-label="Social links">
          <a href="#top" aria-label="Facebook">
            <Facebook size={18} aria-hidden="true" />
          </a>
          <a href="#top" aria-label="LinkedIn">
            <Linkedin size={18} aria-hidden="true" />
          </a>
          <a href="mailto:booking@ezblackcar.com" aria-label="Email">
            <Mail size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="footer-column">
        <h3>Quick Links</h3>
        <a href="#top">Home</a>
        <a href="#services">Airport Service</a>
        <a href="#corporate-accounts">Corporate Accounts</a>
        <a href="#services">Services</a>
        <a href="#why-choose">About Us</a>
        <a href="#contact">Contact</a>
      </div>
      <div className="footer-column">
        <h3>Our Services</h3>
        <a href="#services">DTW Airport Transfers</a>
        <a href="#services">Corporate Transportation</a>
        <a href="#services">Executive SUV Service</a>
        <a href="#services">Hourly Chauffeur Service</a>
        <a href="#services">Long-Distance Travel</a>
      </div>
      <div className="footer-contact">
        <h3>Contact Us</h3>
        <p>
          <Phone size={15} aria-hidden="true" />
          313-555-0124
        </p>
        <p>
          <Mail size={15} aria-hidden="true" />
          booking@ezblackcar.com
        </p>
        <p>
          <MapPin size={15} aria-hidden="true" />
          Serving Metro Detroit and DTW Airport
        </p>
        <a className="footer-book" href="#quote-form">Book a Ride</a>
      </div>
      <div className="footer-bottom">
        <span>© 2024 EZ Black Car. All rights reserved.</span>
        <span>
          <a href="#top">Privacy Policy</a>
          <a href="#top">Terms of Service</a>
        </span>
      </div>
    </footer>
  );
}
