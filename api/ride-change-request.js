import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function cleanEnvValue(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function normalizeBody(body) {
  return typeof body === "string" ? JSON.parse(body) : body;
}

function cleanText(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildRows(details) {
  return details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5dccf;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5dccf;">${escapeHtml(value || "Not provided")}</td></tr>`,
    )
    .join("");
}

function getLocationSummary(form, prefix) {
  if (form[`${prefix}Type`] === "airport") {
    return [form[`${prefix}Airport`], form[`${prefix}Address`], form[`${prefix}City`], form[`${prefix}Zip`]]
      .filter(Boolean)
      .join(" - ");
  }

  return [form[`${prefix}Address`], form[`${prefix}City`], form[`${prefix}Zip`]].filter(Boolean).join(", ");
}

async function sendChangeRequestEmail({ form, quote, authorizationResult, quoteRequestId, changeType, message }) {
  const smtpHost = cleanEnvValue(process.env.SMTP_HOST);
  const smtpPort = Number.parseInt(cleanEnvValue(process.env.SMTP_PORT) || "587", 10);
  const smtpUser = cleanEnvValue(process.env.SMTP_USER);
  const smtpPass = cleanEnvValue(process.env.SMTP_PASS);
  const smtpSecure = cleanEnvValue(process.env.SMTP_SECURE).toLowerCase() === "true";
  const fromEmail = cleanEnvValue(process.env.SMTP_FROM_EMAIL) || smtpUser;
  const businessInbox =
    cleanEnvValue(process.env.CONTACT_MESSAGE_ALERT_EMAIL) ||
    cleanEnvValue(process.env.CORPORATE_INQUIRY_ALERT_EMAIL) ||
    fromEmail;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail || !businessInbox) {
    throw new Error("Server environment is missing SMTP configuration.");
  }

  const details = [
    ["Passenger", form.fullName],
    ["Email", form.email],
    ["Phone on Booking", form.phone],
    ["Quote Request ID", quoteRequestId],
    ["Payment Reference", authorizationResult?.paymentIntentId || ""],
    ["Amount Authorized", quote?.totalQuote ? `$${quote.totalQuote}` : ""],
    ["Pickup Date", form.pickupDate],
    ["Pickup Time", form.pickupTime],
    ["Pickup", getLocationSummary(form, "pickup")],
    ["Destination", getLocationSummary(form, "destination")],
    ["Change Type", changeType],
    ["Requested Change", message],
  ];

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `EZ Black Car Website <${fromEmail}>`,
    to: businessInbox,
    replyTo: form.email,
    subject: `Ride Change Request: ${form.fullName || "Authorized Trip"}`,
    text: `A client submitted a ride change request after card authorization.

Passenger: ${form.fullName}
Email: ${form.email}
Phone on Booking: ${form.phone || "Not provided"}
Quote Request ID: ${quoteRequestId || "Not provided"}
Payment Reference: ${authorizationResult?.paymentIntentId || "Not provided"}
Amount Authorized: ${quote?.totalQuote ? `$${quote.totalQuote}` : "Not provided"}
Pickup Date: ${form.pickupDate || "Not provided"}
Pickup Time: ${form.pickupTime || "Not provided"}
Pickup: ${getLocationSummary(form, "pickup") || "Not provided"}
Destination: ${getLocationSummary(form, "destination") || "Not provided"}
Change Type: ${changeType}
Requested Change: ${message}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
        <p>A client submitted a ride change request after card authorization.</p>
        <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:760px;">
          ${buildRows(details)}
        </table>
      </div>
    `,
  });

  await transporter.sendMail({
    from: `EZ Black Car <${fromEmail}>`,
    to: form.email,
    replyTo: businessInbox,
    subject: "We Received Your Ride Change Request",
    text: `Hi ${form.fullName},

We received your ride change request. Your reservation details have not changed automatically. EZ Black Car will review your request and follow up if the change affects price, timing, availability, or authorization.

Requested change:
${message}

EZ Black Car`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
        <p>Hi ${escapeHtml(form.fullName)},</p>
        <p>We received your ride change request. Your reservation details have not changed automatically. EZ Black Car will review your request and follow up if the change affects price, timing, availability, or authorization.</p>
        <p><strong>Requested change:</strong><br/>${escapeHtml(message)}</p>
        <p>EZ Black Car</p>
      </div>
    `,
  });
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

  if (!supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "Server environment is missing Supabase configuration." });
  }

  const body = normalizeBody(req.body);
  let form = body?.form || {};
  let quote = body?.quote || {};
  let authorizationResult = body?.authorizationResult || {};
  const bookingToken = cleanText(body?.bookingToken || body?.token);
  let quoteRequestId = cleanText(body?.quoteRequestId || quote?.quoteRequestId);
  const changeType = cleanText(body?.changeType);
  const message = cleanText(body?.message);
  const requestedDetails = body?.requestedDetails && typeof body.requestedDetails === "object" ? body.requestedDetails : null;

  if ((!quoteRequestId && !bookingToken) || !changeType || !message) {
    return json(res, 400, { error: "Missing required change request details." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (bookingToken) {
    const { data: reservation, error: reservationError } = await supabase
      .from("quote_requests")
      .select("id, customer_name, email, phone, pickup_date, pickup_time, pickup_location, destination, pickup_type, pickup_airport, pickup_address, pickup_city, pickup_zip, destination_type, destination_airport, destination_address, destination_city, destination_zip, passengers, total_quote, amount_authorized, stripe_payment_intent_id")
      .eq("booking_token", bookingToken)
      .single();

    if (reservationError || !reservation) {
      return json(res, 404, { error: "Reservation was not found for this change request." });
    }

    quoteRequestId = reservation.id;
    form = {
      fullName: reservation.customer_name,
      email: reservation.email,
      phone: reservation.phone,
      pickupDate: reservation.pickup_date,
      pickupTime: reservation.pickup_time,
      pickupType: reservation.pickup_type,
      pickupAirport: reservation.pickup_airport,
      pickupAddress: reservation.pickup_address || reservation.pickup_location,
      pickupCity: reservation.pickup_city,
      pickupZip: reservation.pickup_zip,
      destinationType: reservation.destination_type,
      destinationAirport: reservation.destination_airport,
      destinationAddress: reservation.destination_address || reservation.destination,
      destinationCity: reservation.destination_city,
      destinationZip: reservation.destination_zip,
    };
    quote = {
      totalQuote: reservation.amount_authorized || reservation.total_quote,
      quoteRequestId,
    };
    authorizationResult = {
      paymentIntentId: reservation.stripe_payment_intent_id,
    };
  }

  if (!cleanText(form.fullName) || !cleanText(form.email) || !quoteRequestId) {
    return json(res, 400, { error: "Reservation is missing required customer details." });
  }

  const subject = `Ride change request for ${form.pickupDate || "authorized trip"}`;
  const requestedRows = requestedDetails
    ? [
        `Requested Pickup Date: ${cleanText(requestedDetails.pickupDate) || "Not provided"}`,
        `Requested Pickup Time: ${cleanText(requestedDetails.pickupTime) || "Not provided"}`,
        `Requested Pickup: ${cleanText(requestedDetails.pickupLocation) || "Not provided"}`,
        `Requested Destination: ${cleanText(requestedDetails.destination) || "Not provided"}`,
        `Requested Passengers: ${cleanText(requestedDetails.passengers) || "Not provided"}`,
        `Requested Luggage: ${cleanText(requestedDetails.luggageCount) || "Not provided"}`,
        `Requested Flight Details: ${cleanText(requestedDetails.flightNumber) || "Not provided"}`,
      ]
    : [];
  const recordMessage = [
    `Change Type: ${changeType}`,
    `Requested Change: ${message}`,
    ...requestedRows,
    `Quote Request ID: ${quoteRequestId}`,
    `Payment Reference: ${authorizationResult?.paymentIntentId || "Not provided"}`,
    `Amount Authorized: ${quote?.totalQuote ? `$${quote.totalQuote}` : "Not provided"}`,
    `Pickup: ${getLocationSummary(form, "pickup") || "Not provided"}`,
    `Destination: ${getLocationSummary(form, "destination") || "Not provided"}`,
  ].join("\n");

  const { error: changeRequestError } = await supabase.from("ride_change_requests").insert({
    quote_request_id: quoteRequestId,
    full_name: cleanText(form.fullName),
    email: cleanText(form.email),
    phone: cleanText(form.phone) || null,
    change_type: changeType,
    message,
    payment_reference: cleanText(authorizationResult?.paymentIntentId) || null,
    amount_authorized: Number.isFinite(Number.parseFloat(quote?.totalQuote)) ? Number.parseFloat(quote.totalQuote) : null,
    status: "new",
    source: "authorization_screen",
  });

  if (changeRequestError) {
    return json(res, 500, { error: changeRequestError.message || "Failed to record change request against this reservation." });
  }

  const { error: contactError } = await supabase.from("contact_messages").insert({
    full_name: cleanText(form.fullName),
    email: cleanText(form.email),
    phone: cleanText(form.phone) || null,
    inquiry_type: "Ride Change Request",
    subject,
    message: recordMessage,
    status: "new",
    internal_notes: `Submitted after card authorization for quote ${quoteRequestId}.`,
  });

  if (contactError) {
    return json(res, 500, { error: contactError.message || "Failed to record change request." });
  }

  try {
    await sendChangeRequestEmail({ form, quote, authorizationResult, quoteRequestId, changeType, message });
  } catch (mailError) {
    return json(res, 500, {
      error: mailError instanceof Error ? mailError.message : "Change request was recorded, but email delivery failed.",
    });
  }

  return json(res, 200, {
    ok: true,
    message: "Your change request was received. EZ Black Car will review it before making any trip updates.",
  });
}
