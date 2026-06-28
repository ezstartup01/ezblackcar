const image = (name) => `/images/${name}`;

export const navItems = [
  { label: "Home", href: "#top" },
  { label: "Airport Service", href: "#services" },
  { label: "Corporate Accounts", href: "#corporate-accounts" },
  { label: "Services", href: "#services" },
  { label: "About Us", href: "#why-choose" },
  { label: "Contact", href: "#contact" },
];

export const trustItems = [
  {
    title: "Fixed Rates",
    detail: "No surge pricing",
    icon: image("icon-fixed-rates.png"),
  },
  {
    title: "Professional",
    detail: "Chauffeurs",
    icon: image("icon-chauffeur.png"),
  },
  {
    title: "Corporate Billing",
    detail: "Monthly billing available",
    icon: image("icon-corporate-billing.png"),
  },
  {
    title: "DTW Airport",
    detail: "Flight-aware pickups",
    icon: image("icon-airport-service.png"),
  },
];

export const services = [
  {
    title: "DTW Airport Transfers",
    description: "Reliable airport pickup and drop-off with flight tracking and timely service.",
    image: image("service-dtw-airport-transfer.png"),
    icon: image("icon-airport-service.png"),
  },
  {
    title: "Corporate Transportation",
    description: "Dependable service for executives, employees, guests, and corporate clients.",
    image: image("service-corporate-transportation.png"),
    icon: image("icon-corporate-billing.png"),
  },
  {
    title: "Executive SUV Service",
    description: "Ride in comfort and style with our black Ford Expedition. Spacious, clean, and professional.",
    image: image("service-executive-black-suv.png"),
    icon: image("icon-location-pin.png"),
  },
  {
    title: "Hourly Chauffeur Service",
    description: "Perfect for meetings, events, and multi-stop business travel throughout the day.",
    image: image("service-hourly-chauffeur.png"),
    icon: image("icon-clock.png"),
  },
];

export const whyChoose = [
  {
    title: "Fixed Rates",
    description: "Transparent, fixed pricing with no surprises.",
    icon: image("icon-fixed-rates.png"),
  },
  {
    title: "Flight Tracking",
    description: "On-time pickups with real-time flight monitoring.",
    icon: image("icon-airport-service.png"),
  },
  {
    title: "Professional Chauffeur",
    description: "Experienced, courteous, and background-checked.",
    icon: image("icon-chauffeur.png"),
  },
  {
    title: "Licensed & Insured",
    description: "Fully licensed, insured, and safety compliant.",
    icon: image("icon-chauffeur.png"),
  },
  {
    title: "Corporate Billing",
    description: "Monthly billing with detailed invoices.",
    icon: image("icon-corporate-billing.png"),
  },
  {
    title: "On-Time Service",
    description: "Punctual, reliable service you can count on.",
    icon: image("icon-clock.png"),
  },
];

export const serviceAreas = [
  "Detroit",
  "Dearborn",
  "Southfield",
  "Troy",
  "Novi",
  "Ann Arbor",
  "And Surrounding Areas",
];

export const assets = {
  logo: image("ez-black-car-logo-horizontal.png"),
  heroDesktop: image("hero-dtw-black-expedition-right-empty-left.png"),
  heroMobile: image("hero-dtw-black-expedition-mobile.png"),
  whyImage: image("why-choose-executive-passengers-suv.png"),
  corporateImage: image("corporate-accounts-business-billing.png"),
  map: image("michigan-map-gold-transparent.png"),
  clock: image("icon-clock.png"),
  phone: image("icon-phone.png"),
  location: image("icon-location-pin.png"),
};
