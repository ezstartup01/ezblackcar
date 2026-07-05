import { useState } from "react";
import { Mail, MessageSquareText, Phone, Send, Tag, UserRound } from "lucide-react";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  inquiryType: "General Question",
  message: "",
};

export default function ContactForm() {
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

    if (!form.fullName.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus({ tone: "warning", message: "Please complete the required contact fields before submitting." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Contact message could not be sent.");
      }

      setForm(initialForm);
      setStatus({ tone: "success", message: result.message || "Thank you. Your message has been sent." });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again or contact EZ Black Car directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="contact-form-shell">
      <div className="contact-form-heading">
        <span className="contact-form-icon">
          <Mail size={31} aria-hidden="true" />
        </span>
        <div>
          <h2>Send Us a Message</h2>
          <p>Have a question, need support, or want to learn more? Fill out the form below and our team will respond promptly.</p>
        </div>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          <span>Full Name <strong>*</strong></span>
          <div className="field-shell">
            <input name="fullName" value={form.fullName} onChange={updateField} placeholder="Enter your full name" required />
            <UserRound className="field-icon" size={18} aria-hidden="true" />
          </div>
        </label>

        <label>
          <span>Email Address <strong>*</strong></span>
          <div className="field-shell">
            <input name="email" type="email" value={form.email} onChange={updateField} placeholder="Enter your email" required />
            <Mail className="field-icon" size={18} aria-hidden="true" />
          </div>
        </label>

        <label>
          <span>Phone Number</span>
          <div className="field-shell">
            <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="Enter your phone number" />
            <Phone className="field-icon" size={18} aria-hidden="true" />
          </div>
        </label>

        <label>
          <span>Subject <strong>*</strong></span>
          <div className="field-shell">
            <input name="subject" value={form.subject} onChange={updateField} placeholder="Enter a short subject" required />
            <Tag className="field-icon" size={18} aria-hidden="true" />
          </div>
        </label>

        <label className="contact-form-wide">
          <span>Inquiry Type</span>
          <div className="field-shell select-shell">
            <select name="inquiryType" value={form.inquiryType} onChange={updateField}>
              <option>General Question</option>
              <option>Existing Reservation</option>
              <option>Billing Question</option>
              <option>Lost Item</option>
              <option>Corporate Question</option>
              <option>Other</option>
            </select>
          </div>
        </label>

        <label className="contact-form-wide">
          <span>Message <strong>*</strong></span>
          <div className="reservation-textarea-shell contact-message-shell">
            <MessageSquareText className="field-icon textarea-icon" size={18} aria-hidden="true" />
            <textarea
              name="message"
              value={form.message}
              onChange={updateField}
              maxLength={800}
              placeholder="How can we help you?"
              required
            />
            <small>{form.message.length}/800</small>
          </div>
        </label>

        <button className="button primary contact-submit" type="submit" disabled={isSubmitting}>
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>

      <p className="contact-secure-note">Your information is secure and will never be shared.</p>
      {status.message ? <p className={`form-status ${status.tone}`}>{status.message}</p> : null}
    </div>
  );
}
