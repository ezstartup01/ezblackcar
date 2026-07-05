import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function normalizeBody(body) {
  return typeof body === "string" ? JSON.parse(body) : body;
}

function buildClientEmailHtml({ companyName, contactName, transportationNeed, estimatedMonthlyRides, message }) {
  const details = [
    ["Company", companyName],
    ["Contact", contactName],
    ["Transportation Need", transportationNeed],
    ["Estimated Monthly Rides", estimatedMonthlyRides],
    ["Notes", message || "None provided"],
  ];

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5dccf;font-weight:600;">${label}</td><td style="padding:8px 12px;border:1px solid #e5dccf;">${value}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
      <p>Hi ${contactName},</p>
      <p>Thank you for contacting EZ Black Car. We received your corporate account inquiry and our team will review it shortly.</p>
      <p>We will follow up to discuss availability, billing options, and account setup.</p>
      <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:640px;">
        ${rows}
      </table>
      <p>If you need to add anything else, simply reply to this email.</p>
      <p>EZ Black Car<br/>Metro Detroit & DTW Airport Black SUV Service</p>
    </div>
  `;
}

function buildInternalEmailHtml({
  companyName,
  contactName,
  email,
  phone,
  transportationNeed,
  estimatedMonthlyRides,
  message,
}) {
  const details = [
    ["Company", companyName],
    ["Contact", contactName],
    ["Email", email],
    ["Phone", phone],
    ["Transportation Need", transportationNeed],
    ["Estimated Monthly Rides", estimatedMonthlyRides],
    ["Notes", message || "None provided"],
  ];

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5dccf;font-weight:600;">${label}</td><td style="padding:8px 12px;border:1px solid #e5dccf;">${value}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
      <p>A new corporate inquiry was submitted on ezblackcar.com.</p>
      <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:700px;">
        ${rows}
      </table>
    </div>
  `;
}

async function sendInquiryEmails(form) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
  const businessInbox = process.env.CORPORATE_INQUIRY_ALERT_EMAIL || fromEmail;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail || !businessInbox) {
    throw new Error("Server environment is missing SMTP configuration.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `EZ Black Car <${fromEmail}>`,
    to: form.email,
    replyTo: businessInbox,
    subject: "We Received Your Corporate Account Inquiry",
    text: `Hi ${form.contactName},

Thank you for contacting EZ Black Car. We received your corporate account inquiry and our team will review it shortly.

Company: ${form.companyName}
Transportation Need: ${form.transportationNeed}
Estimated Monthly Rides: ${form.estimatedMonthlyRides}

We will follow up to discuss availability, billing options, and account setup.

EZ Black Car`,
    html: buildClientEmailHtml(form),
  });

  await transporter.sendMail({
    from: `EZ Black Car Website <${fromEmail}>`,
    to: businessInbox,
    replyTo: form.email,
    subject: `New Corporate Inquiry: ${form.companyName}`,
    text: `New corporate inquiry received.

Company: ${form.companyName}
Contact: ${form.contactName}
Email: ${form.email}
Phone: ${form.phone}
Transportation Need: ${form.transportationNeed}
Estimated Monthly Rides: ${form.estimatedMonthlyRides}
Notes: ${form.message || "None provided"}`,
    html: buildInternalEmailHtml(form),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "Server environment is missing Supabase configuration." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const form = normalizeBody(req.body);

  const payload = {
    company_name: String(form.companyName || "").trim(),
    contact_name: String(form.contactName || "").trim(),
    email: String(form.email || "").trim(),
    phone: String(form.phone || "").trim(),
    transportation_need: String(form.transportationNeed || "").trim(),
    estimated_monthly_rides: String(form.estimatedMonthlyRides || "").trim(),
    message: String(form.message || "").trim() || null,
    status: "new",
  };

  if (
    !payload.company_name ||
    !payload.contact_name ||
    !payload.email ||
    !payload.phone ||
    !payload.transportation_need ||
    !payload.estimated_monthly_rides
  ) {
    return json(res, 400, { error: "Missing required corporate inquiry fields." });
  }

  const { error } = await supabase.from("corporate_inquiries").insert(payload);

  if (error) {
    return json(res, 500, { error: error.message || "Failed to save corporate inquiry." });
  }

  try {
    await sendInquiryEmails({
      companyName: payload.company_name,
      contactName: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      transportationNeed: payload.transportation_need,
      estimatedMonthlyRides: payload.estimated_monthly_rides,
      message: payload.message,
    });
  } catch (mailError) {
    return json(res, 500, {
      error:
        mailError instanceof Error
          ? mailError.message
          : "Corporate inquiry was saved, but email delivery failed.",
    });
  }

  return json(res, 200, {
    ok: true,
    message:
      "Thank you. Your corporate inquiry has been received, and a confirmation email has been sent.",
  });
}
