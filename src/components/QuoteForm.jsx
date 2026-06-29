import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plane,
  UserRound,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { calculateQuote, defaultQuoteRules, defaultQuoteZones } from "../lib/quoteEngine.js";

const initialForm = {
  pickupDate: "",
  pickupTime: "",
  pickupLocation: "",
  destination: "",
  phone: "",
  airportType: "",
  passengers: "",
  luggageCount: "",
  email: "",
  flightNumber: "",
};

const shortNoticeHours = 3;

function selectToNumber(value) {
  if (String(value || "").includes("+")) {
    const base = parseInt(String(value).replace(/\D/g, ""), 10);
    return Number.isFinite(base) ? base + 1 : null;
  }

  return parseInt(value, 10) || null;
}

function getTodayValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function isShortNoticeRide(form) {
  if (!form.pickupDate || !form.pickupTime) return false;

  const pickupDateTime = new Date(`${form.pickupDate}T${form.pickupTime}`);
  if (Number.isNaN(pickupDateTime.getTime())) return false;

  return pickupDateTime.getTime() - Date.now() < shortNoticeHours * 60 * 60 * 1000;
}

export default function QuoteForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shortNoticeRide = isShortNoticeRide(form);
  const todayValue = getTodayValue();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ tone: "", message: "" });

    if (!isSupabaseConfigured) {
      setStatus({
        tone: "error",
        message: "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
      });
      return;
    }

    setIsSubmitting(true);

    const [{ data: zoneRows }, { data: ruleRows }] = await Promise.all([
      supabase
        .from("quote_zones")
        .select("zone_name, city, zip_codes, aliases, base_airport_pickup, base_airport_dropoff, base_point_to_point")
        .eq("active", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("quote_rules")
        .select("*")
        .eq("active", true)
        .limit(1),
    ]);

    const quote = await calculateQuote(
      form,
      zoneRows?.length ? zoneRows : defaultQuoteZones,
      ruleRows?.[0] || defaultQuoteRules,
    );

    const quoteRequest = {
      pickup_date: form.pickupDate,
      pickup_time: form.pickupTime,
      pickup_location: form.pickupLocation,
      destination: form.destination,
      phone: form.phone,
      airport_type: form.airportType || null,
      passengers: selectToNumber(form.passengers),
      luggage_count: selectToNumber(form.luggageCount),
      email: form.email || null,
      flight_number: form.flightNumber || null,
      matched_zone: quote.matchedZone,
      distance_miles: quote.distanceMiles,
      duration_minutes: quote.durationMinutes,
      base_fare: quote.baseFare,
      airport_fee: quote.airportFee,
      late_night_fee: quote.lateNightFee,
      extra_fees: quote.extraFees,
      gratuity: quote.gratuity,
      total_quote: quote.totalQuote,
      quote_status: quote.quoteStatus,
      notes: quote.reviewReasons.length ? quote.reviewReasons.join(", ") : null,
    };

    const { error } = await supabase.from("quote_requests").insert(quoteRequest);

    setIsSubmitting(false);

    if (error) {
      setStatus({
        tone: "error",
        message: error.message || "Something went wrong. Please call or try again.",
      });
      return;
    }

    setForm(initialForm);
    setStatus({
      tone: "success",
      message: quote.reviewReasons.includes("pickup_under_3_hours")
        ? "Quote request sent. For rides within the next 3 hours, please call us to confirm immediate availability."
        : quote.totalQuote
        ? `Estimated Black SUV Quote: $${quote.totalQuote}. Final confirmation will be sent by text/email.`
        : "Quote request sent. Final confirmation will be sent by text/email.",
    });
  }

  const fieldIcons = {
    pickupDate: CalendarDays,
    pickupTime: Clock3,
    pickupLocation: MapPin,
    destination: MapPin,
    phone: Phone,
    passengers: UserRound,
    luggageCount: BriefcaseBusiness,
    email: Mail,
    flightNumber: Plane,
  };

  function FieldIcon({ name }) {
    if (name === "pickupDate" || name === "pickupTime") return null;

    const Icon = fieldIcons[name];
    return Icon ? <Icon className="field-icon" size={18} aria-hidden="true" /> : null;
  }

  return (
    <section id="quote-form" className="quote-section" aria-labelledby="quote-title">
      <div className="quote-panel">
        <div className="section-kicker">
          <Clock3 size={24} aria-hidden="true" />
          <span>Get a Quote in Seconds</span>
        </div>
        <h2 id="quote-title">Get a Quote in Seconds</h2>
        <form className="quote-form" onSubmit={handleSubmit}>
          <label>
            <span>Pickup Date</span>
            <div className="field-shell">
              <input
                name="pickupDate"
                type="date"
                min={todayValue}
                value={form.pickupDate}
                onChange={updateField}
                required
              />
              <FieldIcon name="pickupDate" />
            </div>
          </label>
          <label>
            <span>Pickup Time</span>
            <div className="field-shell">
              <input
                name="pickupTime"
                type="time"
                step="900"
                value={form.pickupTime}
                onChange={updateField}
                required
              />
              <FieldIcon name="pickupTime" />
            </div>
          </label>
          <label>
            <span>Pickup Location</span>
            <div className="field-shell">
              <input
                name="pickupLocation"
                value={form.pickupLocation}
                onChange={updateField}
                placeholder="Enter pickup location"
                required
              />
              <FieldIcon name="pickupLocation" />
            </div>
          </label>
          <label>
            <span>Destination</span>
            <div className="field-shell">
              <input
                name="destination"
                value={form.destination}
                onChange={updateField}
                placeholder="Enter destination"
                required
              />
              <FieldIcon name="destination" />
            </div>
          </label>
          <label>
            <span>Phone Number</span>
            <div className="field-shell">
              <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="(313) 555-0124" required />
              <FieldIcon name="phone" />
            </div>
          </label>
          <label>
            <span>Airport Pickup / Drop-off</span>
            <div className="field-shell select-shell">
              <select name="airportType" value={form.airportType} onChange={updateField}>
                <option value="">Select an option</option>
                <option>Airport Pickup</option>
                <option>Airport Drop-off</option>
                <option>Not Airport Related</option>
              </select>
            </div>
          </label>
          <label>
            <span>Passengers</span>
            <div className="field-shell select-shell">
              <FieldIcon name="passengers" />
              <select name="passengers" value={form.passengers} onChange={updateField}>
                <option value="">Select</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6+</option>
              </select>
            </div>
          </label>
          <label>
            <span>Luggage Count</span>
            <div className="field-shell select-shell">
              <FieldIcon name="luggageCount" />
              <select name="luggageCount" value={form.luggageCount} onChange={updateField}>
                <option value="">Select</option>
                <option>0</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5+</option>
              </select>
            </div>
          </label>
          <label>
            <span>Email Address</span>
            <div className="field-shell">
              <input name="email" type="email" value={form.email} onChange={updateField} placeholder="name@email.com" />
              <FieldIcon name="email" />
            </div>
          </label>
          <label>
            <span>Flight Number (Optional)</span>
            <div className="field-shell">
              <input name="flightNumber" value={form.flightNumber} onChange={updateField} placeholder="AA1234" />
              <FieldIcon name="flightNumber" />
            </div>
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Request Ride Quote"}
          </button>
        </form>
        {shortNoticeRide && (
          <p className="form-status warning">
            For rides within the next 3 hours, please call us to confirm immediate availability.
          </p>
        )}
        {status.message && <p className={`form-status ${status.tone}`}>{status.message}</p>}
      </div>
    </section>
  );
}
