import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function cleanEnvValue(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function updateQuotePaymentStatus(supabase, paymentIntent) {
  const quoteRequestId = paymentIntent.metadata?.quote_request_id;
  if (!quoteRequestId) return;

  const amountAuthorized = paymentIntent.amount ? paymentIntent.amount / 100 : null;
  const amountCaptured = paymentIntent.amount_received ? paymentIntent.amount_received / 100 : 0;
  const updates = {
    stripe_customer_id: typeof paymentIntent.customer === "string" ? paymentIntent.customer : paymentIntent.customer?.id || null,
    stripe_payment_intent_id: paymentIntent.id,
    payment_status: paymentIntent.status,
    amount_authorized: amountAuthorized,
    amount_captured: amountCaptured,
  };

  if (paymentIntent.status === "requires_capture") {
    updates.payment_authorized_at = new Date().toISOString();
    updates.status = "payment_authorized";
  }

  if (paymentIntent.status === "succeeded") {
    updates.status = "payment_captured";
  }

  await supabase.from("quote_requests").update(updates).eq("id", quoteRequestId);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const stripeSecretKey = cleanEnvValue(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = cleanEnvValue(process.env.STRIPE_WEBHOOK_SECRET);
  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
    return json(res, 500, { error: "Server environment is missing Stripe webhook or Supabase configuration." });
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : "Invalid Stripe webhook signature." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (
    event.type === "payment_intent.amount_capturable_updated" ||
    event.type === "payment_intent.succeeded" ||
    event.type === "payment_intent.payment_failed" ||
    event.type === "payment_intent.canceled"
  ) {
    await updateQuotePaymentStatus(supabase, event.data.object);
  }

  return json(res, 200, { received: true });
}
