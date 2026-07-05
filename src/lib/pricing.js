export const PRICING_MODE = "launch_competitive";

// Launch pricing is kept in one place so we can tune rates without touching UI code.
export const launchCompetitivePricing = {
  minimumFare: 85,
  baseFare: 45,
  perMile: 2.25,
  perMinute: 0.65,
  dtwAirportPickupFee: 10,
  lateNightFee: 10,
  extraStopFee: 15,
  childSeatFee: 10,
  waitTimeHourlyRate: 60,
  maxPassengers: 6,
  maxLuggage: 5,
  longDistanceMiles: 75,
};

const dtwTerms = [
  "dtw",
  "detroit metro airport",
  "detroit metropolitan wayne county airport",
  "detroit metropolitan airport",
  "romulus airport",
  "detroit metro",
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function roundUpToNearest5(amount) {
  return Math.ceil(amount / 5) * 5;
}

export function isLateNightPickup(timeValue) {
  if (!timeValue) return false;
  const match = String(timeValue).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const hour = Number.parseInt(match[1], 10);
  return Number.isFinite(hour) && (hour >= 23 || hour < 5);
}

export function isDtwAirport(value) {
  const normalized = normalizeText(value);
  return dtwTerms.some((term) => normalized.includes(term));
}

export function getZoneAliases(zone) {
  return [zone.zone_name, zone.city, ...(zone.aliases || [])]
    .filter(Boolean)
    .map(normalizeText);
}

export function matchZone(location, zones = []) {
  const normalized = normalizeText(location);
  if (!normalized) return null;

  const zip = normalized.match(/\b\d{5}\b/)?.[0];
  return zones.find((zone) => {
    if (zip && Array.isArray(zone.zip_codes) && zone.zip_codes.includes(zip)) return true;
    return getZoneAliases(zone).some((alias) => alias && normalized.includes(alias));
  }) || null;
}

export function calculateLaunchCompetitiveQuote({
  pickupLocation,
  destination,
  pickupDate,
  pickupTime,
  passengers,
  luggageCount,
  tripType,
  route,
  zones = [],
  specialEvent = false,
}) {
  const reviewReasons = [];
  const distanceMiles = route?.distanceMiles ?? null;
  const durationMinutes = route?.durationMinutes ?? null;

  if (!pickupLocation || !destination) reviewReasons.push("Pickup or destination could not be parsed.");
  if (!Number.isFinite(distanceMiles) || !Number.isFinite(durationMinutes)) {
    reviewReasons.push("Distance or duration is unavailable.");
  }
  if (passengers && passengers > launchCompetitivePricing.maxPassengers) {
    reviewReasons.push("Passenger count exceeds black SUV instant quote limit.");
  }
  if (luggageCount && luggageCount > launchCompetitivePricing.maxLuggage) {
    reviewReasons.push("Luggage count exceeds black SUV instant quote limit.");
  }
  if (Number.isFinite(distanceMiles) && distanceMiles > launchCompetitivePricing.longDistanceMiles) {
    reviewReasons.push("Long-distance trip requires review.");
  }
  if (specialEvent) {
    reviewReasons.push("Special event or custom route requires review.");
  }

  const airportPickupApplies = tripType === "airport_pickup" && isDtwAirport(pickupLocation);
  const lateNightApplies = isLateNightPickup(pickupTime);
  const matchedZone = matchZone(tripType === "airport_pickup" ? destination : pickupLocation, zones);

  const mileageCharge = Number.isFinite(distanceMiles)
    ? Number((distanceMiles * launchCompetitivePricing.perMile).toFixed(2))
    : 0;
  const timeCharge = Number.isFinite(durationMinutes)
    ? Number((durationMinutes * launchCompetitivePricing.perMinute).toFixed(2))
    : 0;
  const rawQuote = Number((launchCompetitivePricing.baseFare + mileageCharge + timeCharge).toFixed(2));

  let subtotal = Math.max(launchCompetitivePricing.minimumFare, rawQuote);
  if (matchedZone && tripType === "airport_pickup") subtotal = Number(matchedZone.base_airport_pickup);
  if (matchedZone && tripType === "airport_dropoff") subtotal = Number(matchedZone.base_airport_dropoff);
  if (matchedZone && tripType === "point_to_point") subtotal = Number(
    matchedZone.base_point_to_point || matchedZone.base_airport_dropoff || matchedZone.base_airport_pickup,
  );

  const airportFee = airportPickupApplies ? launchCompetitivePricing.dtwAirportPickupFee : 0;
  const lateNightFee = lateNightApplies ? launchCompetitivePricing.lateNightFee : 0;
  const extraFees = 0;
  const roundedTotal = roundUpToNearest5(subtotal + airportFee + lateNightFee + extraFees);

  return {
    totalQuote: roundedTotal,
    quoteStatus: reviewReasons.length ? "manual_review" : "instant_quote",
    pricingMode: PRICING_MODE,
    distanceMiles: Number.isFinite(distanceMiles) ? Number(distanceMiles.toFixed(1)) : null,
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
    matchedZone: matchedZone?.zone_name || null,
    breakdown: {
      minimumFare: launchCompetitivePricing.minimumFare,
      baseFare: launchCompetitivePricing.baseFare,
      mileageCharge,
      timeCharge,
      airportFee,
      lateNightFee,
      extraFees,
      rawQuote,
      roundedTotal,
    },
    manualReviewReasons: reviewReasons,
    status: "quote_generated",
  };
}
