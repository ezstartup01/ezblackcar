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

function formatMoney(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2).replace(/\.00$/, "")}` : "Pending";
}

function formatDateTime(row) {
  return [row.pickup_date, row.pickup_time].filter(Boolean).join(" ") || "Pending";
}

function buildRows(details) {
  return details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5dccf;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5dccf;">${escapeHtml(value || "Not provided")}</td></tr>`,
    )
    .join("");
}

function getSiteOrigin(req) {
  const configured =
    cleanEnvValue(process.env.PUBLIC_SITE_URL) ||
    cleanEnvValue(process.env.SITE_URL) ||
    cleanEnvValue(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  if (configured) {
    return configured.startsWith("http") ? configured.replace(/\/$/, "") : `https://${configured.replace(/\/$/, "")}`;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host || "www.ezblackcar.com";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
}

async function sendAuthorizationEmail({ req, row }) {
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

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error("Server environment is missing SMTP configuration.");
  }

  const reservationUrl = `${getSiteOrigin(req)}/reservation/${row.booking_token}`;
  const details = [
    ["Reservation Status", "Awaiting final confirmation"],
    ["Passenger", row.customer_name],
    ["Pickup Date & Time", formatDateTime(row)],
    ["Pickup", row.pickup_location],
    ["Destination", row.destination],
    ["Passengers", row.passengers],
    ["Amount Authorized", formatMoney(row.amount_authorized || row.total_quote)],
    ["Authorization Reference", row.stripe_payment_intent_id ? row.stripe_payment_intent_id.slice(-8).toUpperCase() : ""],
  ];

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `EZ Black Car <${fromEmail}>`,
    to: row.email,
    replyTo: businessInbox,
    subject: "EZ Black Car Ride Authorization Received",
    text: `Hi ${row.customer_name || "there"},

Thank you. Your card authorization was received securely. Your reservation is awaiting final confirmation from EZ Black Car.

Pickup Date & Time: ${formatDateTime(row)}
Pickup: ${row.pickup_location || "Not provided"}
Destination: ${row.destination || "Not provided"}
Passengers: ${row.passengers || "Not provided"}
Amount Authorized: ${formatMoney(row.amount_authorized || row.total_quote)}

Your reservation link:
${reservationUrl}

Use this link to review your booking details or request a change. Submitting a change request does not update the trip automatically; EZ Black Car will review it first.

EZ Black Car`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
        <p>Hi ${escapeHtml(row.customer_name || "there")},</p>
        <p>Thank you. Your card authorization was received securely. Your reservation is awaiting final confirmation from EZ Black Car.</p>
        <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:720px;">
          ${buildRows(details)}
        </table>
        <p>
          <a href="${escapeHtml(reservationUrl)}" style="display:inline-block;background:#07111e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;">
            View Reservation or Request a Change
          </a>
        </p>
        <p style="font-size:13px;color:#4b5563;">Submitting a change request does not update the trip automatically. EZ Black Car will review it before any price, timing, availability, or authorization changes are made.</p>
        <p>EZ Black Car</p>
      </div>
    `,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "Server environment is missing Supabase service configuration." });
  }

  let body;
  try {
    body = normalizeBody(req.body);
  } catch {
    return json(res, 400, { error: "Invalid authorization email payload." });
  }

  const quoteRequestId = cleanText(body?.quoteRequestId);
  const paymentIntentId = cleanText(body?.paymentIntentId);

  if (!quoteRequestId || !paymentIntentId) {
    return json(res, 400, { error: "Missing reservation or payment reference." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: row, error } = await supabase
    .from("quote_requests")
    .select("id, booking_token, customer_name, email, phone, pickup_date, pickup_time, pickup_location, destination, passengers, total_quote, amount_authorized, stripe_payment_intent_id, payment_status, authorization_email_sent_at")
    .eq("id", quoteRequestId)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (error || !row) {
    return json(res, 404, { error: "Authorized reservation was not found." });
  }

  if (!row.booking_token || !row.email) {
    return json(res, 400, { error: "Reservation is missing email or booking link token." });
  }

  await supabase
    .from("quote_requests")
    .update({
      payment_status: "requires_capture",
      payment_authorized_at: new Date().toISOString(),
    })
    .eq("id", quoteRequestId);

  if (row.authorization_email_sent_at) {
    return json(res, 200, { ok: true, message: "Authorization email was already sent." });
  }

  try {
    await sendAuthorizationEmail({ req, row });
  } catch (mailError) {
    return json(res, 500, {
      error: mailError instanceof Error ? mailError.message : "Authorization was saved, but email delivery failed.",
    });
  }

  const { error: updateError } = await supabase
    .from("quote_requests")
    .update({ authorization_email_sent_at: new Date().toISOString() })
    .eq("id", quoteRequestId);

  if (updateError) {
    return json(res, 500, { error: updateError.message || "Authorization email sent, but status was not saved." });
  }

  return json(res, 200, {
    ok: true,
    message: "Authorization email sent.",
    reservationUrl: `${getSiteOrigin(req)}/reservation/${row.booking_token}`,
  });
}
