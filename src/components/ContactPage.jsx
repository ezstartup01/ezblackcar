import {
  BriefcaseBusiness,
  Calculator,
  CarFront,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plane,
} from "lucide-react";
import ContactForm from "./ContactForm.jsx";
import { assets, serviceAreas } from "../data/siteContent.js";
import { legalContact } from "../data/legalContent.js";

const contactCards = [
  { icon: Mail, title: "Email Us", detail: legalContact.email },
  { icon: Phone, title: "Call Us", detail: legalContact.phone },
  { icon: MapPin, title: "Service Area", detail: "Metro Detroit & DTW Airport" },
  { icon: Clock3, title: "Availability", detail: "24/7 service support" },
];

const chooseItems = [
  "Premium black SUVs and professional chauffeurs",
  "On-time airport transportation",
  "Airport experts for DTW",
  "Corporate accounts and executive travel",
  "Point-to-point service across Metro Detroit",
];

const supportCards = [
  {
    icon: MapPin,
    title: "Service Area",
    copy: "Proudly serving Metro Detroit and surrounding communities.",
    label: "View Our Service Area",
    href: "#where-we-serve",
  },
  {
    icon: Plane,
    title: "Airport Service",
    copy: "DTW airport pickups and drop-offs with real-time flight monitoring.",
    label: "Learn More",
    href: "/#services",
  },
  {
    icon: BriefcaseBusiness,
    title: "Corporate Accounts",
    copy: "Executive transportation solutions for businesses and travel managers.",
    label: "Work With Us",
    href: "/#corporate-inquiry",
  },
  {
    icon: Calculator,
    title: "Request a Quote",
    copy: "Get an estimated quote for your trip in just a few clicks.",
    label: "Get a Quote",
    href: "/#quote-form",
  },
];

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-hero">
        <img src={assets.contactHero} alt="Black SUV with Detroit skyline for EZ Black Car contact page" />
        <div className="contact-hero-overlay" />
        <div className="contact-hero-inner">
          <p className="eyebrow">Premium. Reliable. Professional.</p>
          <h1>Contact EZ Black Car</h1>
          <p>
            We're here to help with general inquiries, support, and account assistance. Reach out to our team and we'll
            get back to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="contact-main-section">
        <ContactForm />

        <aside className="contact-side-panel">
          <div className="contact-info-card">
            {contactCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title}>
                  <span><Icon size={27} aria-hidden="true" /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="contact-choose-card">
            <h2>Why Choose EZ Black Car?</h2>
            {chooseItems.map((item) => (
              <p key={item}>
                <CheckCircle2 size={17} aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </aside>
      </section>

      <section className="contact-support-grid" aria-label="Helpful contact shortcuts">
        {supportCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title}>
              <span><Icon size={34} aria-hidden="true" /></span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
                <a href={item.href}>{item.label} <span aria-hidden="true">&rarr;</span></a>
              </div>
            </article>
          );
        })}
      </section>

      <section id="where-we-serve" className="contact-map-section">
        <div className="contact-map-media">
          <img src={assets.contactMap} alt="Metro Detroit service area map for EZ Black Car" />
          <div className="contact-map-copy">
            <h2>Where We Serve</h2>
            <p>We provide black SUV transportation throughout Metro Detroit and surrounding areas.</p>
            <div className="contact-city-list">
              {serviceAreas
                .filter((area) => area !== "And Surrounding Areas")
                .concat(["Birmingham", "Bloomfield Hills", "Canton", "Livonia", "Royal Oak", "Sterling Heights"])
                .map((area) => (
                  <span key={area}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {area}
                  </span>
                ))}
            </div>
          </div>
          <div className="contact-map-pin">
            <MapPin size={26} aria-hidden="true" />
            <strong>Detroit</strong>
          </div>
        </div>
      </section>

      <section className="contact-cta-band">
        <span><CarFront size={42} aria-hidden="true" /></span>
        <div>
          <h2>Ready to ride in comfort and style?</h2>
          <p>Book your ride now or request a custom quote for your next trip.</p>
        </div>
        <div className="contact-cta-actions">
          <a className="button dark" href="/#quote-form">Book a Ride</a>
          <a className="button primary" href="/#quote-form">Request a Quote</a>
        </div>
      </section>
    </main>
  );
}
