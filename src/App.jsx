import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock3,
  FileText,
  MapPin,
  Plane,
  Shield,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import QuoteForm from "./components/QuoteForm.jsx";
import { assets, serviceAreas, services, trustItems, whyChoose } from "./data/siteContent.js";

export default function App() {
  const serviceIcons = [Plane, BriefcaseBusiness, ShieldCheck, Clock3];
  const trustIcons = [Tag, UserRound, FileText, Plane];
  const whyIcons = [ShieldCheck, BadgeCheck, UserRound, Shield, BriefcaseBusiness, Clock3];

  return (
    <>
      <Header />
      <main id="top">
        <section className="hero">
          <picture>
            <source srcSet={assets.heroMobile} media="(max-width: 700px)" />
            <img src={assets.heroDesktop} alt="Black Ford Expedition at DTW airport curbside" />
          </picture>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">Corporate Black Car Service</p>
            <h1>
              Corporate Black Car Service for <span>DTW & Metro Detroit</span>
            </h1>
            <p className="hero-copy">
              Professional black SUV transportation for airport transfers, executives, corporate visitors, and VIP
              clients.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#quote-form">
                Book a Ride <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a className="button secondary" href="#corporate-accounts">
                Corporate Accounts
              </a>
            </div>
          </div>
        </section>

        <QuoteForm />

        <section className="trustbar" aria-label="EZ Black Car advantages">
          {trustItems.map((item, index) => {
            const Icon = trustIcons[index];
            return (
            <div key={item.title}>
              <span className="trust-icon">
                <Icon size={30} aria-hidden="true" />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
            </div>
            );
          })}
        </section>

        <section id="services" className="section services-section">
          <div className="section-heading">
            <p className="eyebrow">Our Services</p>
            <h2>Premium Transportation for Every Need</h2>
          </div>
          <div className="service-grid">
            {services.map((service, index) => (
              <article className="service-card" key={service.title}>
                <img className="service-image" src={service.image} alt="" />
                <div className="service-card-body">
                  <span className="service-icon-badge">
                    {(() => {
                      const Icon = serviceIcons[index];
                      return <Icon size={24} aria-hidden="true" />;
                    })()}
                  </span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="why-choose" className="section why-section">
          <div className="why-copy">
            <p className="eyebrow">Why Choose</p>
            <h2>Why Choose EZ Black Car</h2>
            <div className="why-grid">
              {whyChoose.map((item, index) => {
                const Icon = whyIcons[index];
                return (
                <div className="why-item" key={item.title}>
                  <span className="why-icon">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </div>
                );
              })}
            </div>
          </div>
          <img className="why-image" src={assets.whyImage} alt="Executive passengers riding in a black SUV" />
        </section>

        <section id="corporate-accounts" className="corporate-section">
          <div className="corporate-copy">
            <p className="eyebrow">Corporate Accounts</p>
            <h2>Corporate Accounts Made Simple</h2>
            <p>We make corporate transportation easy, reliable, and efficient for companies of all sizes.</p>
            <a className="button dark" href="#quote-form">
              Start Account Request
            </a>
          </div>
          <div className="corporate-list">
            {[
              "Monthly billing available",
              "W-9 available",
              "Insurance certificate available",
              "Priority booking and dedicated support",
              "Ideal for executives and client visits",
            ].map((item) => (
              <p key={item}>
                <Check size={18} aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
          <img src={assets.corporateImage} alt="Corporate transportation account billing materials" />
        </section>

        <section id="contact" className="area-band">
          <div className="area-section">
            <MapPin className="area-pin" size={58} aria-hidden="true" />
            <div className="area-title">
              <p className="eyebrow">Proudly Serving</p>
              <h2>Metro Detroit & DTW Airport</h2>
            </div>
            <div className="area-cities" aria-label="Service areas">
              {serviceAreas.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>
            <img className="michigan-map" src={assets.map} alt="" aria-hidden="true" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
