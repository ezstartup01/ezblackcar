import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { defaultQuoteZones } from "../src/data/defaultQuoteData.js";
import { calculateLaunchCompetitiveQuote } from "../src/lib/pricing.js";
import { airportOptions } from "../src/lib/quoteEngine.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function cleanEnvValue(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function omitKeys(object, keys) {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
}

function getMissingColumn(errorMessage) {
  const match = String(errorMessage || "").match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

function toNumber(value) {
  if (String(value || "").includes("+")) {
    const base = Number.parseInt(String(value).replace(/\D/g, ""), 10);
    return Number.isFinite(base) ? base + 1 : null;
  }
  const parsed = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getAirportByCode(code) {
  return airportOptions.find((airport) => airport.value === code) || null;
}

function buildLocation(form, prefix) {
  const type = form[`${prefix}Type`];
  if (type === "airport") {
    const airport = getAirportByCode(form[`${prefix}Airport`]);
    return airport ? `${airport.label}, ${airport.city}, ${airport.zip}` : "";
  }
  return [form[`${prefix}Address`], form[`${prefix}City`], form[`${prefix}Zip`]].filter(Boolean).join(", ");
}

function getTripType(form) {
  const airportPickup = form.pickupType === "airport";
  const airportDropoff = form.destinationType === "airport";
  if (airportPickup && airportDropoff) return "airport_to_airport";
  if (airportPickup) return "airport_pickup";
  if (airportDropoff) return "airport_dropoff";
  return "point_to_point";
}

async function geocodeAddress(address, token, fallbackProximity) {
  const params = new URLSearchParams({
    access_token: token,
    country: "us",
    limit: "1",
    proximity: fallbackProximity,
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

async function resolveRoute(form, token) {
  const pickupAirport = getAirportByCode(form.pickupAirport);
  const destinationAirport = getAirportByCode(form.destinationAirport);
  const fallbackProximity = (pickupAirport?.coordinates || airportOptions[0]?.coordinates || [-83.3534, 42.2124]).join(",");
  const pickupLocation = buildLocation(form, "pickup");
  const destination = buildLocation(form, "destination");

  const [pickupCoords, destinationCoords] = await Promise.all([
    form.pickupType === "airport"
      ? pickupAirport?.coordinates || null
      : geocodeAddress(pickupLocation, token, fallbackProximity),
    form.destinationType === "airport"
      ? destinationAirport?.coordinates || null
      : geocodeAddress(destination, token, fallbackProximity),
  ]);

  if (!pickupCoords || !destinationCoords) {
    return { pickupLocation, destination, route: null };
  }

  const params = new URLSearchParams({ access_token: token, overview: "false" });
  const coords = `${pickupCoords.join(",")};${destinationCoords.join(",")}`;
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?${params}`);
  if (!response.ok) {
    return { pickupLocation, destination, route: null };
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) return { pickupLocation, destination, route: null };

  return {
    pickupLocation,
    destination,
    route: {
      distanceMiles: route.distance / 1609.344,
      durationMinutes: Math.round(route.duration / 60),
    },
  };
}

async function insertQuoteRequest(supabase, payload) {
  const id = randomUUID();
  const bookingToken = randomUUID();
  let insertPayload = { id, booking_token: bookingToken, ...payload };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from("quote_requests").insert(insertPayload);
    if (!error) return { id, bookingToken: "booking_token" in insertPayload ? bookingToken : null, error: null };

    const missingColumn = getMissingColumn(error.message);
    if (!missingColumn || !(missingColumn in insertPayload)) {
      return { id: null, error };
    }

    insertPayload = omitKeys(insertPayload, [missingColumn]);
  }

  return {
    id: null,
    error: new Error("Failed to save quote request because the database schema is missing required columns."),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey =
    cleanEnvValue(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );
  const mapboxToken = cleanEnvValue(process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN);

  if (!supabaseUrl || !supabaseKey || !mapboxToken) {
    return json(res, 500, { error: "Server environment is missing Supabase or Mapbox configuration." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const form = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const [{ data: zoneRows }, routeResult] = await Promise.all([
    supabase
      .from("quote_zones")
      .select("zone_name, city, zip_codes, aliases, base_airport_pickup, base_airport_dropoff, base_point_to_point")
      .eq("active", true)
      .order("display_order", { ascending: true }),
    resolveRoute(form, mapboxToken),
  ]);

  const tripType = getTripType(form);
  const quote = calculateLaunchCompetitiveQuote({
    pickupLocation: routeResult.pickupLocation,
    destination: routeResult.destination,
    pickupDate: form.pickupDate,
    pickupTime: form.pickupTime,
    passengers: toNumber(form.passengers),
    luggageCount: toNumber(form.luggageCount),
    tripType,
    route: routeResult.route,
    zones: zoneRows?.length ? zoneRows : defaultQuoteZones,
  });

  const payload = {
    pickup_date: form.pickupDate,
    pickup_time: form.pickupTime,
    pickup_location: routeResult.pickupLocation,
    destination: routeResult.destination,
    airport_type: tripType,
    trip_type: tripType,
    pickup_type: form.pickupType,
    pickup_airport: form.pickupType === "airport" ? form.pickupAirport : null,
    pickup_address: form.pickupType === "address" ? form.pickupAddress : null,
    pickup_city: form.pickupType === "address" ? form.pickupCity : null,
    pickup_zip: form.pickupType === "address" ? form.pickupZip : null,
    destination_type: form.destinationType,
    destination_airport: form.destinationType === "airport" ? form.destinationAirport : null,
    destination_address: form.destinationType === "address" ? form.destinationAddress : null,
    destination_city: form.destinationType === "address" ? form.destinationCity : null,
    destination_zip: form.destinationType === "address" ? form.destinationZip : null,
    passengers: toNumber(form.passengers),
    luggage_count: toNumber(form.luggageCount),
    phone: form.phone || null,
    email: form.email || null,
    flight_number: form.pickupType === "airport" ? form.flightNumber || null : null,
    distance_miles: quote.distanceMiles,
    duration_minutes: quote.durationMinutes,
    base_fare: quote.breakdown.baseFare,
    mileage_charge: quote.breakdown.mileageCharge,
    time_charge: quote.breakdown.timeCharge,
    airport_fee: quote.breakdown.airportFee,
    late_night_fee: quote.breakdown.lateNightFee,
    extra_fees: quote.breakdown.extraFees,
    total_quote: quote.totalQuote,
    quote_status: quote.quoteStatus,
    manual_review_reasons: quote.manualReviewReasons.length ? quote.manualReviewReasons.join(" | ") : null,
    pricing_mode: quote.pricingMode,
    status: quote.status,
    matched_zone: quote.matchedZone,
    notes: quote.manualReviewReasons.length ? quote.manualReviewReasons.join(" | ") : null,
  };

  const { id: quoteRequestId, bookingToken, error } = await insertQuoteRequest(supabase, payload);
  if (error) return json(res, 500, { error: error.message || "Failed to save quote request." });

  return json(res, 200, { ...quote, quoteRequestId, bookingToken });
}
