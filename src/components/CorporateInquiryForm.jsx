import { useState } from "react";
import { BriefcaseBusiness, Building2, Mail, MessageSquareText, Phone, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
const initialForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  transportationNeed: "",
  estimatedMonthlyRides: "",
  message: "",
};

export default function CorporateInquiryForm() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ tone: "", message: "" });

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ tone: "", message: "" });

    if (
      !form.companyName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.transportationNeed.trim() ||
      !form.estimatedMonthlyRides.trim()
    ) {
      setStatus({
        tone: "warning",
        message: "Please complete all required corporate inquiry fields before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    if (!isSupabaseConfigured || !supabase) {
      setIsSubmitting(false);
      setStatus({
        tone: "error",
        message: "Something went wrong. Please try again or contact EZ Black Car directly.",
      });
      return;
    }

    const { data: result, error } = await supabase.functions.invoke("corporate-inquiry", {
      body: form,
    });

    setIsSubmitting(false);

    if (error) {
      setStatus({
        tone: "error",
        message: "Something went wrong. Please try again or contact EZ Black Car directly.",
      });
      return;
    }

    if (!result?.ok) {
      setStatus({
        tone: "error",
        message: result?.error || "Something went wrong. Please try again or contact EZ Black Car directly.",
      });
      return;
    }

    // TODO: fire corporate_inquiry_submitted conversion event if analytics is added.
    setForm(initialForm);
    setStatus({
      tone: "success",
      message: result.message || "Thank you. Your corporate inquiry has been received.",
    });
  }

  const iconMap = {
    companyName: Building2,
    contactName: UserRound,
    email: Mail,
    phone: Phone,
    message: MessageSquareText,
    transportationNeed: BriefcaseBusiness,
  };

  function FieldIcon({ name }) {
    const Icon = iconMap[name];
    return Icon ? <Icon className="field-icon" size={18} aria-hidden="true" /> : null;
  }

  return (
    <div className="corporate-inquiry-shell">
      <form className="corporate-inquiry-form" onSubmit={handleSubmit}>
        <label className="quote-cell">
          <span>Company Name</span>
          <div className="field-shell">
            <input name="companyName" value={form.companyName} onChange={updateField} placeholder="Company name" required />
            <FieldIcon name="companyName" />
          </div>
        </label>

        <label className="quote-cell">
          <span>Contact Name</span>
          <div className="field-shell">
            <input name="contactName" value={form.contactName} onChange={updateField} placeholder="Primary contact name" required />
            <FieldIcon name="contactName" />
          </div>
        </label>

        <label className="quote-cell">
          <span>Email</span>
          <div className="field-shell">
            <input name="email" type="email" value={form.email} onChange={updateField} placeholder="name@company.com" required />
            <FieldIcon name="email" />
          </div>
        </label>

        <label className="quote-cell">
          <span>Phone</span>
          <div className="field-shell">
            <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="(313) 555-0124" required />
            <FieldIcon name="phone" />
          </div>
        </label>

        <label className="quote-cell">
          <span>Transportation Need</span>
          <div className="field-shell select-shell">
            <FieldIcon name="transportationNeed" />
            <select name="transportationNeed" value={form.transportationNeed} onChange={updateField} required>
              <option value="">Select transportation need</option>
              <option>DTW Airport Transfers</option>
              <option>Executive Transportation</option>
              <option>Corporate Visitor Transportation</option>
              <option>Hotel / Guest Transportation</option>
              <option>Meetings & Events</option>
              <option>Recurring Monthly Service</option>
              <option>Other</option>
            </select>
          </div>
        </label>

        <label className="quote-cell">
          <span>Estimated Monthly Rides</span>
          <div className="field-shell select-shell">
            <select name="estimatedMonthlyRides" value={form.estimatedMonthlyRides} onChange={updateField} required>
              <option value="">Select ride volume</option>
              <option>1–5</option>
              <option>6–15</option>
              <option>16–30</option>
              <option>31+</option>
              <option>Not Sure Yet</option>
            </select>
          </div>
        </label>

        <label className="quote-cell corporate-message-field">
          <span>Message / Notes</span>
          <div className="reservation-textarea-shell corporate-message-shell">
            <MessageSquareText className="field-icon textarea-icon" size={18} aria-hidden="true" />
            <textarea
              name="message"
              value={form.message}
              onChange={updateField}
              maxLength={500}
              placeholder="Tell us about your executives, guests, airport volume, billing needs, or partnership request."
            />
            <small>{form.message.length}/500</small>
          </div>
        </label>

        <div className="corporate-trust-note">
          Corporate account requests are reviewed by EZ Black Car. Monthly billing is available for approved accounts.
        </div>

        <button type="submit" className="button primary corporate-submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Request Corporate Account Setup"}
        </button>
      </form>

      {status.message ? <p className={`form-status ${status.tone}`}>{status.message}</p> : null}
    </div>
  );
}
