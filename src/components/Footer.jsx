import { Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { assets } from "../data/siteContent.js";
import { legalContact } from "../data/legalContent.js";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src={assets.logo} alt="EZ Black Car" />
        <p>DTW Airport & Metro Detroit Black SUV Service</p>
        <div className="social-links" aria-label="Social links">
          <a href="/" aria-label="Facebook">
            <Facebook size={18} aria-hidden="true" />
          </a>
          <a href="/" aria-label="LinkedIn">
            <Linkedin size={18} aria-hidden="true" />
          </a>
          <a href={`mailto:${legalContact.email}`} aria-label="Email">
            <Mail size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="footer-column">
        <h3>Quick Links</h3>
        <a href="/">Home</a>
        <a href="/#services">Airport Service</a>
        <a href="/#corporate-inquiry">Corporate Accounts</a>
        <a href="/#services">Services</a>
        <a href="/about">About Us</a>
        <a href="/contact">Contact</a>
      </div>
      <div className="footer-column">
        <h3>Our Services</h3>
        <a href="/#services">DTW Airport Transfers</a>
        <a href="/#services">Corporate Transportation</a>
        <a href="/#services">Executive SUV Service</a>
        <a href="/#services">Hourly Chauffeur Service</a>
        <a href="/#services">Point-to-Point Transportation</a>
      </div>
      <div className="footer-contact">
        <h3>Contact Us</h3>
        <p>
          <Phone size={15} aria-hidden="true" />
          {legalContact.phone}
        </p>
        <p>
          <Mail size={15} aria-hidden="true" />
          {legalContact.email}
        </p>
        <p>
          <MapPin size={15} aria-hidden="true" />
          Serving Metro Detroit and DTW Airport
        </p>
        <a className="footer-book" href="/#quote-form">Book a Ride</a>
      </div>
      <div className="footer-bottom">
        <span>© {currentYear} EZ Black Car. All rights reserved.</span>
        <span className="footer-policy-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-and-conditions">Terms & Conditions</a>
          <a href="/ride-policies">Ride Policies</a>
          <a href="/contact">Contact</a>
        </span>
      </div>
    </footer>
  );
}
