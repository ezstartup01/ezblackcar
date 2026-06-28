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

export default function QuoteForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const quoteRequest = {
      pickup_date: form.pickupDate,
      pickup_time: form.pickupTime,
      pickup_location: form.pickupLocation,
      destination: form.destination,
      phone: form.phone,
      airport_type: form.airportType || null,
      passengers: form.passengers || null,
      luggage_count: form.luggageCount || null,
      email: form.email || null,
      flight_number: form.flightNumber || null,
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
      message: "Quote request sent. We will follow up shortly.",
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
              <input name="pickupDate" value={form.pickupDate} onChange={updateField} placeholder="MM / DD / YYYY" required />
              <FieldIcon name="pickupDate" />
            </div>
          </label>
          <label>
            <span>Pickup Time</span>
            <div className="field-shell">
              <input name="pickupTime" value={form.pickupTime} onChange={updateField} placeholder="Select time" required />
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
        {status.message && <p className={`form-status ${status.tone}`}>{status.message}</p>}
      </div>
    </section>
  );
}
