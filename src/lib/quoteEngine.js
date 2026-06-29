import { defaultQuoteRules, defaultQuoteZones } from "../data/defaultQuoteData.js";

const airportTerms = [
  "dtw",
  "detroit metro airport",
  "detroit metropolitan airport",
  "metro airport",
  "romulus airport",
  "wayne county airport",
];

const mapboxToken = import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN;

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
    proximity: "-83.3534,42.2124",
  });
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.features?.[0]?.center || null;
}

async function getMapboxDistanceMiles(pickupLocation, destination) {
  if (!mapboxToken) return null;

  const [pickupCenter, destinationCenter] = await Promise.all([
    geocodeAddress(pickupLocation),
    geocodeAddress(destination),
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

function resolveBaseFare({ airportPickup, airportDropoff, matchedZone, distanceMiles, rules }) {
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
  const pickupIsAirport = isAirportLocation(form.pickupLocation);
  const destinationIsAirport = isAirportLocation(form.destination);
  const airportPickup = pickupIsAirport || form.airportType === "Airport Pickup";
  const airportDropoff = destinationIsAirport || form.airportType === "Airport Drop-off";
  const nonAirportLocation = airportPickup ? form.destination : form.pickupLocation;
  const matchedZone = matchZone(nonAirportLocation, zones);
  const passengers = toNumber(form.passengers);
  const luggageCount = toNumber(form.luggageCount);
  const reviewReasons = [];

  let route = null;
  if (!matchedZone) {
    route = await getMapboxDistanceMiles(form.pickupLocation, form.destination);
  }

  const baseFare = resolveBaseFare({
    airportPickup,
    airportDropoff,
    matchedZone,
    distanceMiles: route?.distanceMiles,
    rules,
  });

  if (!baseFare) reviewReasons.push("manual_distance_review");
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
  };
}

export { defaultQuoteRules, defaultQuoteZones };
