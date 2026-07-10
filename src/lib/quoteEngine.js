import { defaultQuoteRules, defaultQuoteZones } from "../data/defaultQuoteData.js";

const airportTerms = [
  "airport",
  "dtw",
  "detroit metro",
  "willow run",
  "coleman young",
  "ann arbor municipal",
  "oakland county",
  "oakland troy",
  "grosse ile",
  "custer",
  "mettetal",
  "livingston county",
  "romeo state",
  "lenawee county",
  "toledo executive",
  "windsor international",
];

function cleanEnvValue(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

const mapboxToken = cleanEnvValue(import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN);
const shortNoticeHours = 3;

export const airportOptions = [
  {
    value: "DTW",
    label: "DTW - Detroit Metro Airport",
    name: "Detroit Metro Wayne County Airport",
    city: "Romulus",
    zip: "48174",
    coordinates: [-83.3534, 42.2124],
  },
  {
    value: "YIP",
    label: "YIP - Willow Run Airport",
    name: "Willow Run Airport",
    city: "Van Buren",
    zip: "48111",
    coordinates: [-83.5304, 42.2379],
  },
  {
    value: "DET",
    label: "DET - Coleman Young Airport",
    name: "Coleman A. Young Municipal Airport",
    city: "Detroit",
    zip: "48213",
    coordinates: [-83.0099, 42.4092],
  },
  {
    value: "ARB",
    label: "ARB - Ann Arbor Municipal",
    name: "Ann Arbor Municipal Airport",
    city: "Ann Arbor",
    zip: "48108",
    coordinates: [-83.7456, 42.2230],
  },
  {
    value: "PTK",
    label: "PTK - Oakland County Intl",
    name: "Oakland County International Airport",
    city: "Waterford",
    zip: "48327",
    coordinates: [-83.4201, 42.6655],
  },
  {
    value: "VLL",
    label: "VLL - Oakland Troy Airport",
    name: "Oakland/Troy Airport",
    city: "Troy",
    zip: "48084",
    coordinates: [-83.1779, 42.5428],
  },
  {
    value: "ONZ",
    label: "ONZ - Grosse Ile Municipal",
    name: "Grosse Ile Municipal Airport",
    city: "Grosse Ile",
    zip: "48138",
    coordinates: [-83.1613, 42.0989],
  },
  {
    value: "TTF",
    label: "TTF - Custer Airport",
    name: "Custer Airport",
    city: "Monroe",
    zip: "48162",
    coordinates: [-83.5451, 41.9390],
  },
  {
    value: "1D2",
    label: "1D2 - Mettetal Airport",
    name: "Canton-Plymouth-Mettetal Airport",
    city: "Plymouth",
    zip: "48170",
    coordinates: [-83.4906, 42.3508],
  },
  {
    value: "Y47",
    label: "Y47 - Oakland Southwest",
    name: "Oakland Southwest Airport",
    city: "New Hudson",
    zip: "48165",
    coordinates: [-83.6233, 42.5244],
  },
  {
    value: "OZW",
    label: "OZW - Livingston County",
    name: "Livingston County Airport",
    city: "Howell",
    zip: "48843",
    coordinates: [-83.9810, 42.6293],
  },
  {
    value: "D98",
    label: "D98 - Romeo State Airport",
    name: "Romeo State Airport",
    city: "Romeo",
    zip: "48065",
    coordinates: [-83.0183, 42.7942],
  },
  {
    value: "ADG",
    label: "ADG - Lenawee County",
    name: "Lenawee County Airport",
    city: "Adrian",
    zip: "49221",
    coordinates: [-84.0773, 41.8677],
  },
  {
    value: "TDZ",
    label: "TDZ - Toledo Executive",
    name: "Toledo Executive Airport",
    city: "Millbury",
    zip: "43447",
    coordinates: [-83.4829, 41.5649],
  },
  {
    value: "YQG",
    label: "YQG - Windsor International",
    name: "Windsor International Airport",
    city: "Windsor",
    zip: "N8V",
    coordinates: [-82.9556, 42.2756],
  },
];

const airportCoordinates = Object.fromEntries(
  airportOptions.map((airport) => [airport.value, airport.coordinates]),
);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value) {
  if (String(value || "").includes("+")) {
    const base = Number.parseInt(String(value).replace(/\D/g, ""), 10);
    return Number.isFinite(base) ? base + 1 : null;
  }

  const parsed = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isAirportLocation(value) {
  const normalized = normalizeText(value);
  return airportTerms.some((term) => normalized.includes(term));
}

function getAirportLabel(value) {
  return airportOptions.find((airport) => airport.value === value)?.label || value || "";
}

export function getAirportByCode(value) {
  return airportOptions.find((airport) => airport.value === value) || null;
}

export function buildPickupLocation(form) {
  if (form.pickupType === "airport") {
    const airport = getAirportByCode(form.pickupAirport);
    return airport
      ? `${airport.label}, ${airport.city}, ${airport.zip}`
      : getAirportLabel(form.pickupAirport);
  }

  return [form.pickupAddress, form.pickupCity, form.pickupZip].filter(Boolean).join(", ");
}

export function buildDestinationLocation(form) {
  if (form.destinationType === "airport") {
    const airport = getAirportByCode(form.destinationAirport);
    return airport
      ? `${airport.label}, ${airport.city}, ${airport.zip}`
      : getAirportLabel(form.destinationAirport);
  }

  return [form.destinationAddress, form.destinationCity, form.destinationZip].filter(Boolean).join(", ");
}

function getTripType(form, airportPickup, airportDropoff) {
  if (airportPickup && airportDropoff) return "airport_to_airport";
  if (airportPickup) return "airport_pickup";
  if (airportDropoff) return "airport_dropoff";
  return "point_to_point";
}

function hasLateNightPickup(timeValue) {
  if (!timeValue) return false;

  const normalized = String(timeValue).trim().toLowerCase();
  let hour = null;
  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})/);

  if (twentyFourHour) {
    hour = Number.parseInt(twentyFourHour[1], 10);
  } else {
    const twelveHour = normalized.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/);
    if (twelveHour) {
      hour = Number.parseInt(twelveHour[1], 10);
      if (twelveHour[2] === "pm" && hour !== 12) hour += 12;
      if (twelveHour[2] === "am" && hour === 12) hour = 0;
    }
  }

  return Number.isFinite(hour) && (hour >= 23 || hour < 5);
}

function getPickupDateTime(pickupDate, pickupTime) {
  if (!pickupDate || !pickupTime) return null;

  const dateTime = new Date(`${pickupDate}T${pickupTime}`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

function getZoneAliases(zone) {
  return [zone.zone_name, zone.city, ...(zone.aliases || [])]
    .filter(Boolean)
    .map(normalizeText);
}

function matchZone(location, zones) {
  const normalized = normalizeText(location);
  if (!normalized) return null;

  const zip = normalized.match(/\b\d{5}\b/)?.[0];
  return zones.find((zone) => {
    if (zip && Array.isArray(zone.zip_codes) && zone.zip_codes.includes(zip)) return true;
    return getZoneAliases(zone).some((alias) => alias && normalized.includes(alias));
  }) || null;
}

function roundUpToNearestFive(value) {
  return Math.ceil(value / 5) * 5;
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    access_token: mapboxToken,
    country: "us",
    limit: "1",
    proximity: airportCoordinates.DTW.join(","),
    types: "address,street,place,postcode,locality",
  });
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(address)}&${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  const feature = data.features?.[0];
  return feature?.properties?.coordinates
    ? [feature.properties.coordinates.longitude, feature.properties.coordinates.latitude]
    : feature?.geometry?.coordinates || null;
}

function getAirportCoordinates(type, airportCode) {
  return type === "airport" ? airportCoordinates[airportCode] || null : null;
}

async function resolveRouteForForm(form, pickupLocation, destination) {
  if (!mapboxToken) return null;

  const pickupCoords = getAirportCoordinates(form.pickupType, form.pickupAirport);
  const destinationCoords = getAirportCoordinates(form.destinationType, form.destinationAirport);

  const [pickupCenter, destinationCenter] = await Promise.all([
    pickupCoords ? Promise.resolve(pickupCoords) : geocodeAddress(pickupLocation),
    destinationCoords ? Promise.resolve(destinationCoords) : geocodeAddress(destination),
  ]);

  if (!pickupCenter || !destinationCenter) return null;

  const coords = `${pickupCenter.join(",")};${destinationCenter.join(",")}`;
  const params = new URLSearchParams({
    access_token: mapboxToken,
    overview: "false",
  });
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?${params}`);
  if (!response.ok) return null;

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceMiles: route.distance / 1609.344,
    durationMinutes: Math.round(route.duration / 60),
  };
}

function resolveBaseFare({ airportPickup, airportDropoff, matchedZone, distanceMiles, sameZipTrip, rules }) {
  if (sameZipTrip) return Number(rules.min_fare || 95);

  if (matchedZone) {
    if (airportPickup) return Number(matchedZone.base_airport_pickup);
    if (airportDropoff) return Number(matchedZone.base_airport_dropoff);
    return Number(matchedZone.base_point_to_point || matchedZone.base_airport_dropoff || matchedZone.base_airport_pickup);
  }

  if (Number.isFinite(distanceMiles)) {
    return roundUpToNearestFive(Math.max(Number(rules.min_fare || 95), 45 + distanceMiles * 3.25));
  }

  return null;
}

export async function calculateQuote(form, zones = defaultQuoteZones, rules = defaultQuoteRules) {
  const pickupLocation = buildPickupLocation(form) || form.pickupLocation;
  const destination = buildDestinationLocation(form) || form.destination;
  const pickupIsAirport = form.pickupType === "airport" || isAirportLocation(pickupLocation);
  const destinationIsAirport = form.destinationType === "airport" || isAirportLocation(destination);
  const airportPickup = pickupIsAirport;
  const airportDropoff = destinationIsAirport;
  const tripType = getTripType(form, airportPickup, airportDropoff);
  const nonAirportLocation = airportPickup ? destination : pickupLocation;
  const sameAirportTrip = airportPickup && airportDropoff && form.pickupAirport && form.pickupAirport === form.destinationAirport;
  const sameZipTrip =
    !airportPickup &&
    !airportDropoff &&
    form.pickupZip &&
    form.destinationZip &&
    form.pickupZip === form.destinationZip;
  const matchedZone = matchZone(nonAirportLocation, zones);
  const passengers = toNumber(form.passengers);
  const luggageCount = toNumber(form.luggageCount);
  const pickupDateTime = getPickupDateTime(form.pickupDate, form.pickupTime);
  const reviewReasons = [];

  let route = null;
  if (!matchedZone && !sameZipTrip && !sameAirportTrip) {
    route = await resolveRouteForForm(form, pickupLocation, destination);
  }

  const baseFare = resolveBaseFare({
    airportPickup,
    airportDropoff,
    matchedZone,
    distanceMiles: route?.distanceMiles,
    sameZipTrip,
    rules,
  });

  if (sameAirportTrip) reviewReasons.push("same_airport_selected");
  if (!baseFare) reviewReasons.push("manual_distance_review");
  if (pickupDateTime && pickupDateTime.getTime() - Date.now() < shortNoticeHours * 60 * 60 * 1000) {
    reviewReasons.push("pickup_under_3_hours");
  }
  if (passengers && passengers > Number(rules.max_passengers || 6)) reviewReasons.push("passenger_count_review");
  if (luggageCount && luggageCount > Number(rules.max_luggage || 5)) reviewReasons.push("luggage_count_review");
  if (route?.distanceMiles && route.distanceMiles > 60) reviewReasons.push("long_distance_review");

  const airportFee = airportPickup ? Number(rules.airport_pickup_fee || 0) : 0;
  const lateNightFee = hasLateNightPickup(form.pickupTime) ? Number(rules.late_night_fee || 0) : 0;
  const totalQuote = baseFare ? roundUpToNearestFive(baseFare + airportFee + lateNightFee) : null;

  return {
    matchedZone: matchedZone?.zone_name || null,
    distanceMiles: route?.distanceMiles ? Number(route.distanceMiles.toFixed(1)) : null,
    durationMinutes: route?.durationMinutes || null,
    baseFare,
    airportFee,
    lateNightFee,
    extraFees: 0,
    gratuity: 0,
    totalQuote,
    quoteStatus: reviewReasons.length ? "manual_review" : "instant_quote",
    reviewReasons,
    tripType,
    pickupLocation,
    destination,
  };
}

export { defaultQuoteRules, defaultQuoteZones };
