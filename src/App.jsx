import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Calculator,
  CarFront,
  Check,
  Clock3,
  CreditCard,
  Crown,
  FileText,
  LockKeyhole,
  MapPin,
  Mail,
  Plane,
  Star,
  Sofa,
  Shield,
  ShieldCheck,
  Tag,
  UserRound,
  Users,
} from "lucide-react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AboutPage from "./components/AboutPage.jsx";
import ContactPage from "./components/ContactPage.jsx";
import CorporateInquiryForm from "./components/CorporateInquiryForm.jsx";
import FaqSection from "./components/FaqSection.jsx";
import LegalPage from "./components/LegalPage.jsx";
import QuoteForm from "./components/QuoteForm.jsx";
import ReservationPage from "./components/ReservationPage.jsx";
import { faqItems } from "./data/faqContent.js";
import { assets, serviceAreas, services, trustItems, whyChoose } from "./data/siteContent.js";
import { legalContact, legalPageMeta } from "./data/legalContent.js";

export default function App() {
  const path = window.location.pathname || "/";
  const isHome = path === "/";
  const isAbout = path === "/about";
  const isContact = path === "/contact";
  const reservationMatch = path.match(/^\/reservation\/([^/]+)$/);
  const serviceIcons = [Plane, BriefcaseBusiness, ShieldCheck, Clock3];
  const trustIcons = [Tag, UserRound, FileText, Plane];
  const whyIcons = [ShieldCheck, BadgeCheck, UserRound, Shield, BriefcaseBusiness, Clock3];
  const processIcons = [Calculator, CreditCard, Mail, CarFront];
  const processItems = [
    {
      title: "Get Instant Quote",
      description: "Enter your pickup, destination, date, and time to receive an estimated black SUV quote.",
    },
    {
      title: "Secure Authorization",
      description: "Provide passenger details and securely authorize a card to hold your ride. No charge at the quote stage.",
    },
    {
      title: "Receive Confirmation",
      description: "EZ Black Car reviews availability and sends final confirmation by text or email.",
    },
    {
      title: "Ride in Comfort",
      description: "Your professional black SUV arrives on time for a smooth, reliable ride.",
    },
  ];
  const processTrustItems = [
    { icon: ShieldCheck, label: "No surge pricing" },
    { icon: LockKeyhole, label: "Secure authorization" },
    { icon: UserRound, label: "Professional black SUV service" },
  ];
  const vehicleHighlights = [
    "Black Ford Expedition",
    "Up to 6 passengers",
    "Spacious luggage capacity",
    "Ideal for DTW airport and executive travel",
    "Clean, professional, commercially insured service",
  ];
  const vehicleStats = [
    { icon: Users, value: "6", label: "Passengers" },
    { icon: BriefcaseBusiness, value: "Large", label: "Luggage Space" },
    { icon: MapPin, value: "DTW &", label: "Metro Detroit" },
  ];
  const vehicleBenefits = [
    {
      icon: Star,
      title: "Executive appearance",
      description: "Professional, polished, and ready for your business needs.",
    },
    {
      icon: Sofa,
      title: "Comfortable interior",
      description: "Spacious seating and climate control for a premium experience.",
    },
    {
      icon: Plane,
      title: "Reliable airport service",
      description: "On-time pickups and drop-offs at DTW and across Metro Detroit.",
    },
  ];
  const meta = legalPageMeta[path] || legalPageMeta["/"];
  const canonicalUrl = `${legalContact.website}${path === "/" ? "/" : path}`;
  const ogImageUrl = `${legalContact.website}${assets.heroDesktop}`;
  const homeStructuredData = isHome
    ? [
        {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: legalContact.businessName,
          url: legalContact.website,
          email: legalContact.email,
          image: ogImageUrl,
          areaServed: serviceAreas,
          description:
            "Corporate black SUV service, DTW airport transfers, executive transportation, and Metro Detroit black car service.",
          serviceArea: {
            "@type": "Place",
            name: legalContact.serviceArea,
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ]
    : [];

  if (typeof document !== "undefined") {
    document.title = meta.title;
    const tagConfigs = [
      { selector: 'meta[name="description"]', attr: "content", value: meta.description },
      { selector: 'meta[name="robots"]', attr: "content", value: "index, follow, max-image-preview:large" },
      { selector: 'link[rel="canonical"]', attr: "href", value: canonicalUrl, tag: "link" },
      { selector: 'meta[property="og:type"]', attr: "content", value: "website" },
      { selector: 'meta[property="og:site_name"]', attr: "content", value: legalContact.businessName },
      { selector: 'meta[property="og:title"]', attr: "content", value: meta.title },
      { selector: 'meta[property="og:description"]', attr: "content", value: meta.description },
      { selector: 'meta[property="og:url"]', attr: "content", value: canonicalUrl },
      { selector: 'meta[property="og:image"]', attr: "content", value: ogImageUrl },
      { selector: 'meta[name="twitter:card"]', attr: "content", value: "summary_large_image" },
      { selector: 'meta[name="twitter:title"]', attr: "content", value: meta.title },
      { selector: 'meta[name="twitter:description"]', attr: "content", value: meta.description },
      { selector: 'meta[name="twitter:image"]', attr: "content", value: ogImageUrl },
    ];

    tagConfigs.forEach(({ selector, attr, value, tag = "meta" }) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement(tag);
        const keyMatch = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
        if (keyMatch) element.setAttribute(keyMatch[1], keyMatch[2]);
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
    });

    const existingScripts = document.querySelectorAll('script[data-seo-schema="home"]');
    existingScripts.forEach((script) => script.remove());

    homeStructuredData.forEach((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoSchema = "home";
      script.dataset.schemaIndex = String(index);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }

  return (
    <>
      <Header />
      {reservationMatch ? (
        <ReservationPage token={decodeURIComponent(reservationMatch[1])} />
      ) : isHome ? (
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
                <img className="service-image" src={service.image} alt={service.alt} />
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

        <section className="section process-section" aria-labelledby="process-title">
          <div className="section-heading process-heading">
            <p className="eyebrow">Our Process</p>
            <h2 id="process-title">How It Works</h2>
            <p>Simple, secure, and professional from quote to confirmation.</p>
          </div>

          <div className="process-grid">
            {processItems.map((item, index) => {
              const Icon = processIcons[index];
              const isLast = index === processItems.length - 1;

              return (
                <article className="process-card" key={item.title}>
                  <span className="process-step-number">{index + 1}</span>
                  {!isLast ? <span className="process-arrow" aria-hidden="true">→</span> : null}
                  <div className="process-icon-shell">
                    <Icon size={42} aria-hidden="true" />
                  </div>
                  <h3>{item.title}</h3>
                  <span className="process-divider" aria-hidden="true" />
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="process-trust-strip" aria-label="Process benefits">
            {processTrustItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label}>
                  <Icon size={34} aria-hidden="true" />
                  <strong>{item.label}</strong>
                </div>
              );
            })}
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

        <section className="section vehicle-section" aria-labelledby="vehicle-title">
          <div className="vehicle-showcase">
            <div className="vehicle-media-column">
              <img
                className="vehicle-image"
                src={services[2].image}
                alt="Black Ford Expedition executive SUV in front of a city building"
              />
            </div>

            <div className="vehicle-copy">
              <p className="eyebrow">Our Vehicle</p>
              <h2 id="vehicle-title">Executive Black SUV</h2>
              <span className="vehicle-copy-divider" aria-hidden="true" />
              <p className="vehicle-copy-intro">
                Travel in comfort and style with our Executive Black SUV service. Perfect for airport transfers,
                corporate travel, and special occasions across Metro Detroit.
              </p>

              <div className="vehicle-highlight-list">
                {vehicleHighlights.map((item) => (
                  <p key={item}>
                    <Check size={20} aria-hidden="true" />
                    <strong>{item}</strong>
                  </p>
                ))}
              </div>

              <div className="vehicle-values-pill">
                <Crown size={24} aria-hidden="true" />
                <strong>Comfort</strong>
                <span aria-hidden="true">•</span>
                <strong>Space</strong>
                <span aria-hidden="true">•</span>
                <strong>Professionalism</strong>
              </div>
              <div className="vehicle-stats-strip" aria-label="Vehicle details">
                {vehicleStats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label}>
                      <Icon size={34} aria-hidden="true" />
                      <div>
                        <strong>{item.value}</strong>
                        <small>{item.label}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="vehicle-benefits-strip" aria-label="Executive SUV benefits">
            {vehicleBenefits.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title}>
                  <Icon size={46} aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="corporate-inquiry" className="section corporate-hub-section" aria-labelledby="corporate-inquiry-title">
          <div className="corporate-hub-shell">
            <div className="corporate-hub-form-column">
              <p className="eyebrow">Corporate Accounts</p>
              <h2 id="corporate-inquiry-title">Corporate Accounts Made Simple</h2>
              <p className="corporate-hub-intro">
                Reliable black SUV transportation for executives, corporate visitors, airport transfers, meetings, and
                VIP clients throughout Metro Detroit.
              </p>
              <CorporateInquiryForm />
            </div>

            <div className="corporate-hub-copy-column">
              <img
                className="corporate-hub-image"
                src={assets.corporateImage}
                alt="Corporate transportation account billing materials"
              />

              <div className="corporate-list">
                {[
                  "Monthly billing available for approved accounts",
                  "W-9 available upon request",
                  "Insurance certificate available upon request",
                  "Fixed DTW airport rates",
                  "Priority booking for corporate clients",
                  "Detailed receipts and invoices",
                  "Executive airport pickups and VIP guest transportation",
                ].map((item) => (
                  <p key={item}>
                    <Check size={18} aria-hidden="true" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FaqSection imageSrc={assets.faqContactImage} />

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
      ) : isAbout ? (
        <AboutPage />
      ) : isContact ? (
        <ContactPage />
      ) : (
        <LegalPage path={path} />
      )}
      <Footer />
    </>
  );
}
