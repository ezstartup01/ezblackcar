import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildClientEmailHtml({
  companyName,
  contactName,
  transportationNeed,
  estimatedMonthlyRides,
  message,
}: {
  companyName: string;
  contactName: string;
  transportationNeed: string;
  estimatedMonthlyRides: string;
  message: string | null;
}) {
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
}: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  transportationNeed: string;
  estimatedMonthlyRides: string;
  message: string | null;
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

async function sendInquiryEmails(form: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  transportationNeed: string;
  estimatedMonthlyRides: string;
  message: string | null;
}) {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Number.parseInt(Deno.env.get("SMTP_PORT") || "587", 10);
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  const smtpSecure = String(Deno.env.get("SMTP_SECURE") || "false").toLowerCase() === "true";
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || smtpUser;
  const businessInbox = Deno.env.get("CORPORATE_INQUIRY_ALERT_EMAIL") || fromEmail;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail || !businessInbox) {
    throw new Error("Missing SMTP configuration in Supabase Edge Function secrets.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase server credentials in Edge Function secrets.");
    }

    const body = await request.json();
    const payload = {
      company_name: String(body.companyName || "").trim(),
      contact_name: String(body.contactName || "").trim(),
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      transportation_need: String(body.transportationNeed || "").trim(),
      estimated_monthly_rides: String(body.estimatedMonthlyRides || "").trim(),
      message: String(body.message || "").trim() || null,
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
      return new Response(JSON.stringify({ error: "Missing required corporate inquiry fields." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from("corporate_inquiries").insert(payload);

    if (error) {
      throw new Error(error.message || "Failed to save corporate inquiry.");
    }

    await sendInquiryEmails({
      companyName: payload.company_name,
      contactName: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      transportationNeed: payload.transportation_need,
      estimatedMonthlyRides: payload.estimated_monthly_rides,
      message: payload.message,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message:
          "Thank you. Your corporate inquiry has been received, and a confirmation email has been sent.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Corporate inquiry processing failed.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
