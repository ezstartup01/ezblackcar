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

async function sendContactEmails(form) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
  const businessInbox = process.env.CONTACT_MESSAGE_ALERT_EMAIL || process.env.CORPORATE_INQUIRY_ALERT_EMAIL || fromEmail;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail || !businessInbox) {
    throw new Error("Server environment is missing SMTP configuration.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const details = [
    ["Name", form.fullName],
    ["Email", form.email],
    ["Phone", form.phone],
    ["Inquiry Type", form.inquiryType],
    ["Subject", form.subject],
    ["Message", form.message],
  ];

  await transporter.sendMail({
    from: `EZ Black Car <${fromEmail}>`,
    to: form.email,
    replyTo: businessInbox,
    subject: "We Received Your Message",
    text: `Hi ${form.fullName},

Thank you for contacting EZ Black Car. We received your message and our team will respond as soon as possible.

Subject: ${form.subject}
Inquiry Type: ${form.inquiryType}

EZ Black Car`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
        <p>Hi ${escapeHtml(form.fullName)},</p>
        <p>Thank you for contacting EZ Black Car. We received your message and our team will respond as soon as possible.</p>
        <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:640px;">
          ${buildRows(details.filter(([label]) => label !== "Phone" && label !== "Message"))}
        </table>
        <p>If you need to add anything else, simply reply to this email.</p>
        <p>EZ Black Car<br/>Metro Detroit & DTW Airport Black SUV Service</p>
      </div>
    `,
  });

  await transporter.sendMail({
    from: `EZ Black Car Website <${fromEmail}>`,
    to: businessInbox,
    replyTo: form.email,
    subject: `New Contact Message: ${form.subject}`,
    text: `New contact message received.

Name: ${form.fullName}
Email: ${form.email}
Phone: ${form.phone || "Not provided"}
Inquiry Type: ${form.inquiryType}
Subject: ${form.subject}
Message: ${form.message}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1b2340;line-height:1.6;">
        <p>A new contact/support message was submitted on ezblackcar.com.</p>
        <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:700px;">
          ${buildRows(details)}
        </table>
      </div>
    `,
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

  const form = normalizeBody(req.body);
  const payload = {
    full_name: String(form.fullName || "").trim(),
    email: String(form.email || "").trim(),
    phone: String(form.phone || "").trim() || null,
    inquiry_type: String(form.inquiryType || "General Question").trim(),
    subject: String(form.subject || "").trim(),
    message: String(form.message || "").trim(),
    status: "new",
  };

  if (!payload.full_name || !payload.email || !payload.subject || !payload.message) {
    return json(res, 400, { error: "Missing required contact fields." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from("contact_messages").insert(payload);

  if (error) {
    return json(res, 500, { error: error.message || "Failed to save contact message." });
  }

  try {
    await sendContactEmails({
      fullName: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      inquiryType: payload.inquiry_type,
      subject: payload.subject,
      message: payload.message,
    });
  } catch (mailError) {
    return json(res, 500, {
      error: mailError instanceof Error ? mailError.message : "Contact message was saved, but email delivery failed.",
    });
  }

  return json(res, 200, {
    ok: true,
    message: "Thank you. Your message has been received, and a confirmation email has been sent.",
  });
}
