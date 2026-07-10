import { createClient } from "@supabase/supabase-js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function cleanEnvValue(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function getToken(req) {
  const url = new URL(req.url || "/api/reservation", `https://${req.headers.host || "www.ezblackcar.com"}`);
  return String(url.searchParams.get("token") || "").trim();
}

function formatPaymentStatus(status) {
  return status === "requires_capture" ? "Authorization approved" : status || "Awaiting authorization";
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const token = getToken(req);
  if (!token) return json(res, 400, { error: "Reservation link is missing." });

  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "Server environment is missing Supabase service configuration." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: row, error } = await supabase
    .from("quote_requests")
    .select("booking_token, customer_name, email, phone, pickup_date, pickup_time, pickup_location, destination, passengers, luggage_count, flight_number, total_quote, amount_authorized, payment_status, quote_status, status, stripe_payment_intent_id")
    .eq("booking_token", token)
    .single();

  if (error || !row) {
    return json(res, 404, { error: "Reservation was not found." });
  }

  return json(res, 200, {
    reservation: {
      token: row.booking_token,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      pickupDate: row.pickup_date,
      pickupTime: row.pickup_time,
      pickupLocation: row.pickup_location,
      destination: row.destination,
      passengers: row.passengers,
      luggageCount: row.luggage_count,
      flightNumber: row.flight_number,
      totalQuote: row.total_quote,
      amountAuthorized: row.amount_authorized || row.total_quote,
      paymentStatus: formatPaymentStatus(row.payment_status),
      reservationStatus: "Awaiting final confirmation",
      authorizationReference: row.stripe_payment_intent_id ? row.stripe_payment_intent_id.slice(-8).toUpperCase() : "",
    },
  });
}
