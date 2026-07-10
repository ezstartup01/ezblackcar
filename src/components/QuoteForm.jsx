import { useEffect, useState } from "react";
import { AddressAutofill } from "@mapbox/search-js-react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plane,
  SquarePen,
  UserRound,
} from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";
import {
  airportOptions,
  getAirportByCode,
} from "../lib/quoteEngine.js";

const initialForm = {
  pickupDate: "",
  pickupTime: "",
  fullName: "",
  cardholderName: "",
  billingZip: "",
  authorizationAccepted: false,
  pickupType: "address",
  pickupAirport: "DTW",
  pickupAddress: "",
  pickupCity: "",
  pickupZip: "",
  destinationType: "address",
  destinationAirport: "DTW",
  destinationAddress: "",
  destinationCity: "",
  destinationZip: "",
  destinationFlightNumber: "",
  phone: "",
  passengers: "1",
  luggageCount: "",
  email: "",
  flightNumber: "",
  specialInstructions: "",
};

const shortNoticeHours = 3;
function cleanEnvValue(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

const mapboxToken = cleanEnvValue(import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN);
const stripePublishableKey = cleanEnvValue(import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY);
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const STORAGE_KEY = "ezblackcar_quote_flow_v1";
const tripFieldNames = new Set([
  "pickupDate",
  "pickupTime",
  "pickupType",
  "pickupAirport",
  "pickupAddress",
  "pickupCity",
  "pickupZip",
  "destinationType",
  "destinationAirport",
  "destinationAddress",
  "destinationCity",
  "destinationZip",
  "passengers",
  "luggageCount",
]);

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

function formatPickupDate(value) {
  if (!value) return "Pending";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
}

function formatPickupTime(value) {
  if (!value) return "Select time";

  const [hourText, minuteText] = value.split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function isShortNoticeRide(form) {
  if (!form.pickupDate || !form.pickupTime) return false;

  const pickupDateTime = new Date(`${form.pickupDate}T${form.pickupTime}`);
  if (Number.isNaN(pickupDateTime.getTime())) return false;

  return pickupDateTime.getTime() - Date.now() < shortNoticeHours * 60 * 60 * 1000;
}

function getDifferentAirport(currentAirport) {
  return airportOptions.find((airport) => airport.value !== currentAirport)?.value || airportOptions[0]?.value || "";
}

function getAutofillValue(feature, keys) {
  for (const key of keys) {
    const value = feature?.properties?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

const cardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      color: "#111827",
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      "::placeholder": {
        color: "#6b7280",
      },
    },
    invalid: {
      color: "#991b1b",
      iconColor: "#991b1b",
    },
  },
};

function QuoteFormContent() {
  const stripe = useStripe();
  const elements = useElements();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteReady, setQuoteReady] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [currentStep, setCurrentStep] = useState("quote");
  const [cardStatus, setCardStatus] = useState({ complete: false, empty: true });
  const [authorizationResult, setAuthorizationResult] = useState(null);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [authorizationEmailStatus, setAuthorizationEmailStatus] = useState({ tone: "", message: "" });
  const shortNoticeRide = isShortNoticeRide(form);
  const todayValue = getTodayValue();
  const hasAirportTrip = form.pickupType === "airport" || form.destinationType === "airport";
  const reservationReady = Boolean(form.fullName.trim() && form.phone.trim() && form.email.trim());
  const paymentReady = Boolean(
    reservationReady
      && form.cardholderName.trim()
      && form.billingZip.trim()
      && form.authorizationAccepted
      && cardStatus.complete
      && stripe
      && elements,
  );
  const editNeedsConfirmation = currentStep === "authorization" || Boolean(authorizationResult) || !cardStatus.empty;
  const rideDetailsSummary = getRideDetailsSummary();
  const showQuoteForm = !quoteReady || currentStep === "quote";

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.form) setForm({ ...initialForm, ...saved.form });
      if (saved.status && saved.currentStep !== "authorization") setStatus(saved.status);
      if (typeof saved.quoteReady === "boolean") setQuoteReady(saved.quoteReady);
      if (saved.quoteResult) setQuoteResult(saved.quoteResult);
      if (saved.currentStep) setCurrentStep(saved.currentStep);
      if (saved.authorizationResult) setAuthorizationResult(saved.authorizationResult);
    } catch {
      // Ignore stale session data and start fresh.
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form, status, quoteReady, quoteResult, currentStep, authorizationResult }),
    );
  }, [form, status, quoteReady, quoteResult, currentStep, authorizationResult]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    const invalidatesQuote = quoteReady && tripFieldNames.has(name);
    const nextValue = type === "checkbox" ? checked : value;

    setForm((current) => {
      const next = { ...current, [name]: nextValue };

      if (name === "pickupType" && nextValue !== "airport") {
        next.flightNumber = "";
        next.pickupAddress = "";
        next.pickupCity = "";
        next.pickupZip = "";
      }

      if (name === "pickupAirport") {
        const airport = getAirportByCode(nextValue);
        if (airport) {
          next.pickupCity = airport.city;
          next.pickupZip = airport.zip;
          next.pickupAddress = airport.label;
        }
      }

      if (name === "destinationAirport") {
        const airport = getAirportByCode(value);
        if (airport) {
          next.destinationCity = airport.city;
          next.destinationZip = airport.zip;
          next.destinationAddress = airport.label;
        }
      }

      if (name === "pickupType" && nextValue === "airport") {
        const airport = getAirportByCode(next.pickupAirport);
        if (airport) {
          next.pickupCity = airport.city;
          next.pickupZip = airport.zip;
          next.pickupAddress = airport.label;
        }
      }

      if (name === "destinationType" && nextValue === "airport") {
        const airport = getAirportByCode(next.destinationAirport);
        if (airport) {
          next.destinationCity = airport.city;
          next.destinationZip = airport.zip;
          next.destinationAddress = airport.label;
        }
      }

      if (name === "destinationType" && nextValue !== "airport") {
        next.destinationAddress = "";
        next.destinationCity = "";
        next.destinationZip = "";
        next.destinationFlightNumber = "";
      }

      if (
        (name === "pickupType" || name === "pickupAirport" || name === "destinationType") &&
        next.pickupType === "airport" &&
        next.destinationType === "airport" &&
        next.pickupAirport === next.destinationAirport
      ) {
        next.destinationAirport = getDifferentAirport(next.pickupAirport);
      }

      return next;
    });

    if (invalidatesQuote) {
      setQuoteReady(false);
      setQuoteResult(null);
      setCurrentStep("quote");
      setStatus({
        tone: "warning",
        message: "Trip details changed. Please refresh your instant quote before continuing.",
      });
    }
  }

  function applyAddressAutofill(prefix, response) {
    const feature = response?.features?.[0];
    if (!feature) return;

    setForm((current) => ({
      ...current,
      [`${prefix}Address`]: getAutofillValue(feature, ["address_line1", "address", "feature_name"]),
      [`${prefix}City`]: getAutofillValue(feature, ["address_level2", "place", "locality", "region"]),
      [`${prefix}Zip`]: getAutofillValue(feature, ["postcode"]),
    }));
  }

  function renderAddressInput({ prefix, value, placeholder }) {
    const input = (
      <div className="field-shell">
        <input
          name={`${prefix}Address`}
          value={value}
          onChange={updateField}
          placeholder={placeholder}
          autoComplete={`section-${prefix} address-line1`}
          required
        />
        <FieldIcon name={`${prefix}Address`} />
      </div>
    );

    if (!mapboxToken) return input;

    return (
      <AddressAutofill
        accessToken={mapboxToken}
        options={{ country: "US", language: "en", proximity: [-83.3534, 42.2124] }}
        onRetrieve={(response) => applyAddressAutofill(prefix, response)}
      >
        {input}
      </AddressAutofill>
    );
  }

  function renderAirportFields(prefix, airportCode) {
    const airport = getAirportByCode(airportCode);

    return (
      <>
        <label className="quote-cell field-wide">
          <span>{prefix === "pickup" ? "Pickup Airport" : "Destination Airport"}</span>
          <div className="field-shell select-shell">
            <select
              name={`${prefix}Airport`}
              value={airportCode}
              onChange={updateField}
            >
              {airportOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={prefix === "destination" && form.pickupType === "airport" && form.pickupAirport === option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label className="quote-cell field-city">
          <span>{prefix === "pickup" ? "Pickup City" : "Destination City"}</span>
          <div className="field-shell">
            <input
              name={`${prefix}City`}
              value={airport?.city || ""}
              readOnly
              aria-readonly="true"
            />
            <FieldIcon name={`${prefix}City`} />
          </div>
        </label>
        <label className="quote-cell field-zip">
          <span>{prefix === "pickup" ? "Pickup ZIP" : "Destination ZIP"}</span>
          <div className="field-shell compact-shell">
            <input
              name={`${prefix}Zip`}
              value={airport?.zip || ""}
              readOnly
              aria-readonly="true"
            />
            <FieldIcon name={`${prefix}Zip`} />
          </div>
        </label>
        <label className="quote-cell field-flight">
          <span>{prefix === "pickup" ? "Flight Number (Optional)" : "Airline / Flight (Optional)"}</span>
          <div className="field-shell compact-shell">
            <input
              name={prefix === "pickup" ? "flightNumber" : "destinationFlightNumber"}
              value={prefix === "pickup" ? form.flightNumber : form.destinationFlightNumber || ""}
              onChange={updateField}
              placeholder="AA1234"
            />
            <FieldIcon name="flightNumber" />
          </div>
        </label>
      </>
    );
  }

  function renderAddressFields(prefix, value) {
    return (
      <>
        <label className="quote-cell field-wide">
          <span>{prefix === "pickup" ? "Pickup Address" : "Destination Address"}</span>
          {renderAddressInput({ prefix, value, placeholder: "Street address" })}
        </label>
        <label className="quote-cell field-city">
          <span>{prefix === "pickup" ? "Pickup City" : "Destination City"}</span>
          <div className="field-shell">
            <input
              name={`${prefix}City`}
              value={form[`${prefix}City`]}
              onChange={updateField}
              placeholder="City"
              autoComplete={`section-${prefix} address-level2`}
              required
            />
            <FieldIcon name={`${prefix}City`} />
          </div>
        </label>
        <label className="quote-cell field-zip">
          <span>{prefix === "pickup" ? "Pickup ZIP" : "Destination ZIP"}</span>
          <div className="field-shell compact-shell">
            <input
              name={`${prefix}Zip`}
              value={form[`${prefix}Zip`]}
              onChange={updateField}
              placeholder="ZIP code"
              inputMode="numeric"
              autoComplete={`section-${prefix} postal-code`}
              required
            />
            <FieldIcon name={`${prefix}Zip`} />
          </div>
        </label>
        <div className="quote-cell field-flight field-flight-placeholder" aria-hidden="true" />
      </>
    );
  }

  function getLocationSummary(prefix) {
    const isAirport = form[`${prefix}Type`] === "airport";
    if (isAirport) {
      const airport = getAirportByCode(form[`${prefix}Airport`]);
      return airport ? `${airport.label} • ${airport.city} ${airport.zip}` : form[`${prefix}Airport`];
    }

    return [form[`${prefix}Address`], form[`${prefix}City`], form[`${prefix}Zip`]].filter(Boolean).join(", ");
  }

  function getRideDetailsSummary() {
    const details = [];

    if (form.pickupDate || form.pickupTime) {
      details.push([form.pickupDate, form.pickupTime].filter(Boolean).join(" • "));
    }

    if (form.passengers) {
      details.push(`${form.passengers} passenger${form.passengers === "1" ? "" : "s"}`);
    }

    if (form.luggageCount && form.luggageCount !== "0") {
      details.push(`${form.luggageCount} luggage`);
    }

    return details;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ tone: "", message: "" });

    if (!form.pickupDate || !form.pickupTime) {
      setStatus({
        tone: "warning",
        message: "Please select both pickup date and pickup time before requesting your quote.",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus({
        tone: "error",
        message: "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
      });
      return;
    }

    setIsSubmitting(true);
    let quote = null;
    let error = null;
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const raw = await response.text();
      let payload = null;

      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          throw new Error("Quote service returned an invalid response. Please try again.");
        }
      }

      if (!response.ok) {
        error = { message: payload?.error || "Unable to generate quote." };
      } else {
        quote = payload;
      }
    } catch (requestError) {
      error = { message: requestError instanceof Error ? requestError.message : "Unable to generate quote." };
    }

    setIsSubmitting(false);

    if (error) {
      setStatus({
        tone: "error",
        message: error.message || "Something went wrong. Please call or try again.",
      });
      return;
    }

    setQuoteReady(true);
    setQuoteResult(quote);
    setCurrentStep("reservation");
    setStatus({ tone: "", message: "" });
  }

  function handleEditSearch() {
    if (editNeedsConfirmation) {
      setShowEditConfirmation(true);
      return;
    }

    confirmEditQuote();
  }

  function confirmEditQuote() {
    setShowEditConfirmation(false);
    setAuthorizationResult(null);
    setCardStatus({ complete: false, empty: true });
    setCurrentStep("quote");
    setStatus((current) => ({
      ...current,
      message: quoteReady
        ? "Review or update your trip details. Refresh the quote if anything changes."
        : current.message,
    }));
  }

  function handleBookNewRide() {
    setForm(initialForm);
    setStatus({ tone: "", message: "" });
    setIsSubmitting(false);
    setQuoteReady(false);
    setQuoteResult(null);
    setCurrentStep("quote");
    setCardStatus({ complete: false, empty: true });
    setAuthorizationResult(null);
    setShowEditConfirmation(false);
    setAuthorizationEmailStatus({ tone: "", message: "" });
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  function handleContinueToAuthorization() {
    if (!reservationReady) {
      setStatus({
        tone: "warning",
        message: "Please complete full name, phone number, and email before continuing to secure authorization.",
      });
      return;
    }

    setCurrentStep("authorization");
    setStatus({
      tone: "success",
      message: "Passenger details saved. Secure card authorization is the next step.",
    });
  }

  async function handleReserveRide() {
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim()) {
      setStatus({
        tone: "warning",
        message: "Please complete full name, phone number, and email before reserving the ride.",
      });
      return;
    }

    if (!form.cardholderName.trim() || !form.billingZip.trim()) {
      setStatus({
        tone: "warning",
        message: "Please complete cardholder name and billing ZIP before reserving the ride.",
      });
      return;
    }

    if (!form.authorizationAccepted) {
      setStatus({
        tone: "warning",
        message: "Please accept the authorization terms before reserving the ride.",
      });
      return;
    }

    if (!cardStatus.complete) {
      setStatus({
        tone: "warning",
        message: "Please complete the secure card information before reserving the ride.",
      });
      return;
    }

    if (!stripe || !elements) {
      setStatus({
        tone: "warning",
        message: "Secure card authorization is still loading. Please try again in a moment.",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setStatus({
        tone: "error",
        message: "Secure card field is unavailable. Please refresh the page and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: "", message: "" });

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          quote: quoteResult,
          authorizationAccepted: form.authorizationAccepted,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.clientSecret) {
        throw new Error(payload?.error || "Unable to start secure payment authorization.");
      }

      const confirmation = await stripe.confirmCardPayment(payload.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: form.cardholderName,
            email: form.email,
            phone: form.phone,
            address: {
              postal_code: form.billingZip,
            },
          },
        },
      });

      if (confirmation.error) {
        throw new Error(confirmation.error.message || "Card authorization failed.");
      }

      const paymentIntent = confirmation.paymentIntent;
      const nextAuthorizationResult = {
        amountAuthorized: quoteResult?.totalQuote,
        paymentIntentId: paymentIntent?.id || payload.paymentIntentId || "",
        paymentStatus: paymentIntent?.status || payload.paymentStatus || "authorized",
      };
      setAuthorizationResult(nextAuthorizationResult);
      setCurrentStep("authorization");
      setStatus({ tone: "", message: "" });

      try {
        const emailResponse = await fetch("/api/send-authorization-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteRequestId: quoteResult?.quoteRequestId,
            paymentIntentId: nextAuthorizationResult.paymentIntentId,
          }),
        });
        const emailPayload = await emailResponse.json().catch(() => null);

        if (!emailResponse.ok) {
          throw new Error(emailPayload?.error || "Authorization email could not be sent.");
        }

        setAuthorizationEmailStatus({
          tone: "success",
          message: "We sent your reservation details and change-request link by email.",
        });
      } catch (emailError) {
        setAuthorizationEmailStatus({
          tone: "warning",
          message: emailError instanceof Error
            ? emailError.message
            : "Your authorization was approved, but the email could not be sent.",
        });
      }
    } catch (paymentError) {
      setStatus({
        tone: "error",
        message: paymentError instanceof Error ? paymentError.message : "Card authorization failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldIcons = {
    pickupDate: CalendarDays,
    pickupTime: Clock3,
    pickupAddress: MapPin,
    pickupCity: MapPin,
    pickupZip: MapPin,
    destinationAddress: MapPin,
    destinationCity: MapPin,
    destinationZip: MapPin,
    phone: Phone,
    passengers: UserRound,
    luggageCount: BriefcaseBusiness,
    email: Mail,
    fullName: UserRound,
    flightNumber: Plane,
    cardholderName: UserRound,
    billingZip: MapPin,
  };

  function FieldIcon({ name }) {
    if (name === "pickupDate" || name === "pickupTime") return null;

    const Icon = fieldIcons[name];
    return Icon ? <Icon className="field-icon" size={18} aria-hidden="true" /> : null;
  }

  return (
    <section id="quote-form" className="quote-section" aria-labelledby="quote-title">
      <div className="quote-panel">
        <div className="quote-flow-nav" aria-label="Reservation steps">
          <div className={`quote-flow-step ${currentStep === "quote" ? "active" : quoteReady ? "complete" : ""}`}>
            <span>1</span>
            <strong>Quote</strong>
          </div>
          <div className={`quote-flow-step ${currentStep === "reservation" ? "active" : currentStep === "authorization" ? "complete" : ""}`}>
            <span>2</span>
            <strong>Reservation</strong>
          </div>
          <div className={`quote-flow-step ${currentStep === "authorization" ? "active" : "muted"}`}>
            <span>3</span>
            <strong>Authorization</strong>
          </div>
        </div>
        <h2 id="quote-title">Get a Quote in Seconds</h2>
        {showQuoteForm ? (
          <>
            <div className="section-kicker">
              <Clock3 size={24} aria-hidden="true" />
              <span className="quote-heading-text">Get a Quote in Seconds</span>
              <div className="quote-header-fields">
                <label className="compact-field">
                  <span>Pickup Date</span>
                  <input
                    className="compact-native-input"
                    name="pickupDate"
                    type="date"
                    min={todayValue}
                    value={form.pickupDate}
                    onChange={updateField}
                    required
                  />
                </label>
                <label className="compact-field">
                  <span>Pickup Time</span>
                  <input
                    className="compact-native-input"
                    name="pickupTime"
                    type="time"
                    step="900"
                    value={form.pickupTime}
                    onChange={updateField}
                    required
                  />
                </label>
              </div>
            </div>
            <form className="quote-form" onSubmit={handleSubmit}>
              <div className="quote-row pickup-row">
                <label className="quote-cell field-type">
                  <span>Pickup From</span>
                  <div className="field-shell select-shell">
                    <select name="pickupType" value={form.pickupType} onChange={updateField}>
                      <option value="airport">Airport</option>
                      <option value="address">Address / Hotel / Office</option>
                    </select>
                  </div>
                </label>
                {form.pickupType === "airport"
                  ? renderAirportFields("pickup", form.pickupAirport)
                  : renderAddressFields("pickup", form.pickupAddress)}
              </div>

              <div className="quote-row destination-row">
                <label className="quote-cell field-type">
                  <span>Destination</span>
                  <div className="field-shell select-shell">
                    <select name="destinationType" value={form.destinationType} onChange={updateField}>
                      <option value="airport">Airport</option>
                      <option value="address">Address / Hotel / Office</option>
                    </select>
                  </div>
                </label>
                {form.destinationType === "airport"
                  ? renderAirportFields("destination", form.destinationAirport)
                  : renderAddressFields("destination", form.destinationAddress)}
              </div>

              <div className="quote-row details-row">
                <label className="quote-cell detail-cell detail-cell-phone">
                  <span>Phone Number</span>
                  <div className="field-shell">
                    <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="(313) 555-0124" required />
                    <FieldIcon name="phone" />
                  </div>
                </label>
                <label className="quote-cell detail-cell detail-cell-email field-wide">
                  <span>Email Address</span>
                  <div className="field-shell">
                    <input name="email" type="email" value={form.email} onChange={updateField} placeholder="name@email.com" />
                    <FieldIcon name="email" />
                  </div>
                </label>
                <label className="quote-cell detail-cell detail-cell-passengers field-city">
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
                <label className="quote-cell detail-cell detail-cell-luggage field-zip">
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
                <div className="quote-cell field-flight-placeholder" aria-hidden="true" />
              </div>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : quoteReady ? "REFRESH INSTANT QUOTE" : "GET INSTANT QUOTE"}
              </button>
            </form>
            {shortNoticeRide && (
              <p className="form-status warning">
                For rides within the next 3 hours, please call us to confirm immediate availability.
              </p>
            )}
          </>
        ) : null}
        {status.message && <p className={`form-status ${status.tone}`}>{status.message}</p>}
        {quoteReady && quoteResult && currentStep !== "quote" && (
          <section className="quote-next-step" aria-labelledby="quote-next-step-title">
            <h3 id="quote-next-step-title" className="sr-only">
              {currentStep === "authorization" ? "Authorization" : "Passenger Details & Reservation"}
            </h3>
            <div className="quote-summary-strip" role="group" aria-label="Quote summary">
              <div className="quote-summary-cell quote-summary-quote">
                <span>Estimate Quote</span>
                <strong>${quoteResult.totalQuote}</strong>
              </div>
              <div className="quote-summary-cell quote-summary-datetime">
                <span>Date Time</span>
                <strong>{formatPickupDate(form.pickupDate)}</strong>
                <small>{formatPickupTime(form.pickupTime)}</small>
              </div>
              <div className="quote-summary-cell quote-summary-location">
                <span>Pickup</span>
                <strong>{getLocationSummary("pickup") || "Pending pickup details"}</strong>
              </div>
              <div className="quote-summary-cell quote-summary-location">
                <span>Destination</span>
                <strong>{getLocationSummary("destination") || "Pending destination details"}</strong>
              </div>
              <div className="quote-summary-cell quote-summary-other">
                <span>Other Details</span>
                <strong>{form.passengers ? `${form.passengers} Passenger${form.passengers === "1" ? "" : "s"}` : "Passenger pending"}</strong>
                {form.luggageCount && form.luggageCount !== "0" ? <small>Luggage {form.luggageCount}</small> : null}
              </div>
            </div>
            {currentStep === "authorization" ? (
              <div className="authorization-step-panel" aria-live="polite">
                <div className="authorization-step-icon">
                  <CreditCard size={26} aria-hidden="true" />
                </div>
                <div className="authorization-step-copy">
                  <span className="authorization-step-kicker">Authorization</span>
                  <h4>Card Authorization Complete</h4>
                  <p>
                    Thank you. Your card authorization was received securely. EZ Black Car will review the trip
                    details and send your final confirmation by email or text.
                  </p>
                </div>
                <div className="authorization-step-details" aria-label="Authorization details">
                  <div>
                    <span>Amount Authorized</span>
                    <strong>${authorizationResult?.amountAuthorized || quoteResult.totalQuote}</strong>
                  </div>
                  <div>
                    <span>Payment Status</span>
                    <strong>{authorizationResult?.paymentStatus === "requires_capture" ? "Authorized" : authorizationResult?.paymentStatus || "Authorized"}</strong>
                  </div>
                  <div>
                    <span>Reference</span>
                    <strong>{authorizationResult?.paymentIntentId ? authorizationResult.paymentIntentId.slice(-8).toUpperCase() : "Pending"}</strong>
                  </div>
                </div>
                <div className="authorization-step-actions">
                  <button type="button" className="button reservation-continue" onClick={handleBookNewRide}>
                    Book a New Ride
                  </button>
                </div>
                <p className="authorization-lock-note">
                  We emailed your booking details and secure reservation link. Use that link if you need to request
                  a change after leaving this screen.
                </p>
                {authorizationEmailStatus.message && (
                  <p className={`form-status ${authorizationEmailStatus.tone}`}>{authorizationEmailStatus.message}</p>
                )}
              </div>
            ) : (
            <div className="reservation-stage">
              <div className="reservation-stage-main">
                <div className="reservation-stage-heading">
                  <div>
                    <h4>Reserve & Authorize</h4>
                    <p>Enter the contact and card authorization details needed to hold this ride.</p>
                  </div>
                </div>

                <div className="reservation-columns">
                  <section className="reservation-column">
                    <div className="reservation-grid reservation-grid-contact">
                      <label className="quote-cell">
                        <span>Full Name</span>
                        <div className="field-shell">
                          <input
                            name="fullName"
                            type="text"
                            value={form.fullName}
                            onChange={updateField}
                            placeholder="Enter passenger name"
                          />
                          <FieldIcon name="fullName" />
                        </div>
                      </label>
                      <label className="quote-cell">
                        <span>Phone Number</span>
                        <div className="field-shell">
                          <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="(313) 555-0124" />
                          <FieldIcon name="phone" />
                        </div>
                      </label>
                      <label className="quote-cell reservation-grid-span-full">
                        <span>Email Address</span>
                        <div className="field-shell">
                          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="name@email.com" />
                          <FieldIcon name="email" />
                        </div>
                      </label>
                      <label className="quote-cell reservation-notes reservation-grid-span-full">
                        <span>Special Instructions / Notes</span>
                        <div className="reservation-textarea-shell">
                          <SquarePen className="field-icon textarea-icon" size={18} aria-hidden="true" />
                          <textarea
                            name="specialInstructions"
                            value={form.specialInstructions}
                            onChange={updateField}
                            maxLength={250}
                            placeholder="Gate code, child seat note, extra stop details, or anything the dispatcher should know."
                          />
                          <small>{form.specialInstructions.length}/250</small>
                        </div>
                      </label>
                    </div>
                  </section>

                  <section className="reservation-column reservation-authorization">
                    <div className="reservation-grid reservation-grid-payment">
                      <label className="quote-cell reservation-grid-span-full">
                        <span>Cardholder Name</span>
                        <div className="field-shell">
                          <input
                            name="cardholderName"
                            type="text"
                            value={form.cardholderName}
                            onChange={updateField}
                            placeholder="Name as it appears on card"
                          />
                          <FieldIcon name="cardholderName" />
                        </div>
                      </label>
                      <label className="quote-cell reservation-grid-span-full">
                        <span>Card Information</span>
                        <div className="field-shell stripe-card-shell">
                          {stripePublishableKey ? (
                            <CardElement
                              options={cardElementOptions}
                              onChange={(event) => setCardStatus({ complete: event.complete, empty: event.empty })}
                            />
                          ) : (
                            <span className="stripe-card-unavailable">Stripe publishable key is not configured.</span>
                          )}
                        </div>
                      </label>
                      <label className="quote-cell reservation-grid-span-full">
                        <span>Billing ZIP Code</span>
                        <div className="field-shell">
                          <input
                            name="billingZip"
                            type="text"
                            inputMode="numeric"
                            value={form.billingZip}
                            onChange={updateField}
                            placeholder="48174"
                          />
                          <FieldIcon name="billingZip" />
                        </div>
                      </label>
                    </div>
                  </section>
                </div>

                <div className="authorization-card">
                  <div className="authorization-notice">
                    <span><strong>Your card will be securely authorized to hold this ride. You will not be charged now:</strong> Charges may apply after final confirmation, completed service, cancellation, no-show, wait time, or extra requested services.</span>
                  </div>

                  <label className="authorization-consent">
                    <input
                      name="authorizationAccepted"
                      type="checkbox"
                      checked={form.authorizationAccepted}
                      onChange={updateField}
                    />
                    <span>
                      I agree to EZ Black Car’s{" "}
                      <a href="/terms-and-conditions">Terms & Conditions</a>,{" "}
                      <a href="/ride-policies">Ride Policies</a>, and{" "}
                      <a href="/privacy-policy">Privacy Policy</a>, and Payment Authorization Policy.
                    </span>
                  </label>
                </div>

                <div className="reservation-action-row">
                  <button type="button" className="button dark reservation-secondary-action" onClick={handleEditSearch}>
                    Edit Quote
                  </button>
                  <button
                    type="button"
                    className="button reservation-continue"
                    onClick={handleReserveRide}
                    disabled={isSubmitting || !paymentReady}
                  >
                    {isSubmitting ? "Authorizing..." : "Reserve the Ride"}
                  </button>
                </div>
              </div>
            </div>
            )}
            {showEditConfirmation && (
              <div className="quote-modal-backdrop" role="presentation">
                <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="edit-quote-confirm-title">
                  <h4 id="edit-quote-confirm-title">Edit quote?</h4>
                  <p>
                    Changing the trip details will leave this secure payment step and clear the current
                    card entry for this quote.
                  </p>
                  <div className="quote-modal-actions">
                    <button type="button" className="button quote-modal-cancel" onClick={() => setShowEditConfirmation(false)}>
                      Stay Here
                    </button>
                    <button type="button" className="button dark quote-modal-confirm" onClick={confirmEditQuote}>
                      Edit Quote
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

export default function QuoteForm() {
  return (
    <Elements stripe={stripePromise}>
      <QuoteFormContent />
    </Elements>
  );
}
