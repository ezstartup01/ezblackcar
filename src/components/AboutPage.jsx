import {
  BadgeCheck,
  BriefcaseBusiness,
  CarFront,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MapPin,
  Phone,
  Plane,
  ShieldCheck,
  Star,
  Target,
  UserRound,
} from "lucide-react";
import { assets } from "../data/siteContent.js";

const values = [
  {
    icon: ShieldCheck,
    title: "Safety First",
    description: "Clean vehicles, careful driving, and professional standards guide every ride.",
  },
  {
    icon: UserRound,
    title: "Professionalism",
    description: "Courteous service for executives, families, airport travelers, and corporate guests.",
  },
  {
    icon: Clock3,
    title: "Punctuality",
    description: "Airport-aware scheduling and reliable communication help keep trips on track.",
  },
  {
    icon: Star,
    title: "Comfort",
    description: "A polished black SUV experience with space for passengers, luggage, and quiet travel.",
  },
  {
    icon: HeartHandshake,
    title: "Customer Focus",
    description: "Every trip is handled with attention to timing, details, and the passenger experience.",
  },
];

const differenceItems = [
  "Professional, uniformed chauffeur service",
  "Clean black SUV for airport and executive travel",
  "Real-time flight details reviewed when provided",
  "Responsive support before and during reservations",
  "Transparent quote process with no surprise surge pricing",
];

const trustPoints = [
  { icon: Plane, title: "DTW Focused", label: "Airport transfers" },
  { icon: BriefcaseBusiness, title: "Corporate Ready", label: "Business travel" },
  { icon: MapPin, title: "Metro Detroit", label: "Local coverage" },
  { icon: BadgeCheck, title: "Licensed & Insured", label: "Professional service" },
];

const fleetFeatures = [
  {
    icon: CarFront,
    title: "Executive SUV",
    description: "Late-model black SUV service with a clean, professional presentation.",
  },
  {
    icon: ShieldCheck,
    title: "Trained Chauffeur",
    description: "Respectful, detail-focused service for business and personal travel.",
  },
  {
    icon: Phone,
    title: "Available Support",
    description: "Communication for airport transfers, events, and corporate transportation.",
  },
];

const bottomTrustItems = [
  { icon: Plane, title: "DTW Airport Specialists", detail: "On-time every time" },
  { icon: BriefcaseBusiness, title: "Corporate Accounts", detail: "Monthly billing available" },
  { icon: Phone, title: "24/7 Support", detail: "We're here to help" },
  { icon: BadgeCheck, title: "Licensed & Insured", detail: "Your safety is guaranteed" },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <img src={assets.aboutHero} alt="Black SUV at Detroit airport during evening travel" />
        <div className="about-hero-overlay" />
        <div className="about-hero-inner">
          <p className="eyebrow">About EZ Black Car</p>
          <h1>
            Driven by Excellence. <span>Committed to You.</span>
          </h1>
          <p>
            EZ Black Car provides premium black SUV transportation for DTW Airport, Metro Detroit, corporate travel,
            executive trips, and hourly chauffeur service.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/#quote-form">Book a Ride</a>
            <a className="button secondary" href="/#corporate-inquiry">Corporate Accounts</a>
          </div>
        </div>
      </section>

      <section className="about-story-section">
        <div className="about-story-copy">
          <p className="eyebrow">Who We Are</p>
          <h2>About EZ Black Car</h2>
          <p>
            EZ Black Car is a professional black car and SUV service based in Metro Detroit. We specialize in airport
            transfers, corporate travel, executive transportation, and hourly chauffeur service.
          </p>
          <p>
            Our mission is simple: provide safe, punctual, and comfortable rides with a personal touch. Whether you are
            traveling for business or personal plans, our goal is to make every mile feel handled.
          </p>
        </div>
        <div className="about-story-media">
          <img src={assets.aboutWhoWeAre} alt="Executive passengers seated inside a black SUV" />
          <div className="about-mission-card">
            <span className="about-mission-icon">
              <Target size={54} aria-hidden="true" />
            </span>
            <div>
              <strong>Our Mission</strong>
              <p>To deliver reliable, comfortable, and stress-free transportation with confidence and peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values-section" aria-labelledby="about-values-title">
        <p className="eyebrow">Our Values</p>
        <h2 id="about-values-title">The Standards That Drive Us</h2>
        <div className="about-values-grid">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <article className="about-value-card" key={item.title}>
                <span><Icon size={34} aria-hidden="true" /></span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-difference-section">
        <div className="about-difference-inner">
          <div className="about-difference-copy">
            <p className="eyebrow">Why Choose Us</p>
            <h2>Experience the EZ Black Car Difference</h2>
            <div className="about-check-list">
              {differenceItems.map((item) => (
                <p key={item}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
            <a className="button primary" href="/#quote-form">Book a Ride</a>
          </div>
          <div className="about-trust-grid">
            {trustPoints.map((item) => {
              const Icon = item.icon;
              return (
                <article className="about-trust-point" key={item.title}>
                  <Icon size={42} aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.label}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-fleet-section">
        <img src={assets.aboutFleet} alt="Black executive SUV parked outside a business entrance" />
        <div className="about-fleet-copy">
          <p className="eyebrow">Our Fleet & Experience</p>
          <h2>Luxury Fleet. Proven Experience.</h2>
          <p>
            Our executive SUV service is designed for comfort, discretion, and dependability. From airport pickups to
            corporate visits, we pay attention to the details that make travel feel easier.
          </p>
          <div className="about-fleet-features">
            {fleetFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title}>
                  <Icon size={36} aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-cta-band">
        <div className="about-cta-icon">
          <Phone size={44} aria-hidden="true" />
        </div>
        <div>
          <h2>Ready to Experience Premium Transportation?</h2>
          <p>Book your ride today and travel with confidence.</p>
        </div>
        <div className="about-cta-actions">
          <a className="button primary" href="/#quote-form">Book a Ride</a>
          <a className="button secondary" href="/contact">Contact Us</a>
        </div>
      </section>

      <section className="about-bottom-trust" aria-label="EZ Black Car service highlights">
        {bottomTrustItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <Icon size={30} aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
