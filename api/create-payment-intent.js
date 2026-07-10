import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

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
  const text = String(value || "").trim();
  return text || null;
}

function toCents(value) {
  const amount = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const stripeSecretKey = cleanEnvValue(process.env.STRIPE_SECRET_KEY);
  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "Server environment is missing Stripe or Supabase service configuration." });
  }

  let body;
  try {
    body = normalizeBody(req.body);
  } catch {
    return json(res, 400, { error: "Invalid payment authorization payload." });
  }

  const form = body?.form || {};
  const quote = body?.quote || {};
  const quoteRequestId = cleanText(quote.quoteRequestId);
  const amountCents = toCents(quote.totalQuote);
  const customerName = cleanText(form.fullName);
  const customerEmail = cleanText(form.email);
  const customerPhone = cleanText(form.phone);
  const billingZip = cleanText(form.billingZip);

  if (!quoteRequestId || !amountCents || !customerName || !customerEmail || !customerPhone || !billingZip) {
    return json(res, 400, {
      error: "Missing required authorization details. Name, email, phone, billing ZIP, quote ID, and amount are required.",
    });
  }

  if (!body?.authorizationAccepted) {
    return json(res, 400, { error: "Payment authorization terms must be accepted before authorizing the card." });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: existingQuote, error: quoteError } = await supabase
    .from("quote_requests")
    .select("id, stripe_customer_id, stripe_payment_intent_id")
    .eq("id", quoteRequestId)
    .single();

  if (quoteError || !existingQuote) {
    return json(res, 404, { error: "Quote request was not found for payment authorization." });
  }

  let customerId = existingQuote.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      metadata: {
        quote_request_id: quoteRequestId,
        source: "ez_black_car_quote_form",
      },
    });
    customerId = customer.id;
  }

  let paymentIntent;
  if (existingQuote.stripe_payment_intent_id) {
    paymentIntent = await stripe.paymentIntents.update(existingQuote.stripe_payment_intent_id, {
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      capture_method: "manual",
      metadata: {
        quote_request_id: quoteRequestId,
        customer_name: customerName,
        customer_email: customerEmail,
      },
    });
  } else {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      capture_method: "manual",
      payment_method_types: ["card"],
      metadata: {
        quote_request_id: quoteRequestId,
        customer_name: customerName,
        customer_email: customerEmail,
      },
    });
  }

  const { error: updateError } = await supabase
    .from("quote_requests")
    .update({
      customer_name: customerName,
      phone: customerPhone,
      email: customerEmail,
      special_instructions: cleanText(form.specialInstructions),
      billing_zip: billingZip,
      stripe_customer_id: customerId,
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status,
      amount_authorized: amountCents / 100,
    })
    .eq("id", quoteRequestId);

  if (updateError) {
    return json(res, 500, { error: updateError.message || "Failed to save payment authorization details." });
  }

  return json(res, 200, {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    paymentStatus: paymentIntent.status,
  });
}
