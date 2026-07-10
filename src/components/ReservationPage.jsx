import { useEffect, useState } from "react";
import { CreditCard, Mail, MapPin, Route, UserRound } from "lucide-react";

const initialChangeRequest = { changeType: "Pickup time", message: "" };

function formatMoney(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2).replace(/\.00$/, "")}` : "Pending";
}

function formatDateTime(date, time) {
  return [date, time].filter(Boolean).join(" • ") || "Pending";
}

export default function ReservationPage({ token }) {
  const [reservation, setReservation] = useState(null);
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeRequest, setChangeRequest] = useState(initialChangeRequest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changeStatus, setChangeStatus] = useState({ tone: "", message: "" });

  useEffect(() => {
    let ignore = false;

    async function loadReservation() {
      setStatus({ tone: "", message: "" });
      try {
        const response = await fetch(`/api/reservation?token=${encodeURIComponent(token)}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || "Reservation was not found.");
        }

        if (!ignore) setReservation(payload.reservation);
      } catch (error) {
        if (!ignore) {
          setStatus({
            tone: "error",
            message: error instanceof Error ? error.message : "Reservation was not found.",
          });
        }
      }
    }

    loadReservation();

    return () => {
      ignore = true;
    };
  }, [token]);

  function updateChangeRequest(event) {
    const { name, value } = event.target;
    setChangeRequest((current) => ({ ...current, [name]: value }));
  }

  async function submitChangeRequest(event) {
    event.preventDefault();

    if (!changeRequest.changeType || !changeRequest.message.trim()) {
      setChangeStatus({
        tone: "warning",
        message: "Please choose a change type and describe what needs to change.",
      });
      return;
    }

    setIsSubmitting(true);
    setChangeStatus({ tone: "", message: "" });

    try {
      const response = await fetch("/api/ride-change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingToken: token,
          changeType: changeRequest.changeType,
          message: changeRequest.message,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to submit change request.");
      }

      setShowChangeRequest(false);
      setChangeRequest(initialChangeRequest);
      setChangeStatus({
        tone: "success",
        message: payload?.message || "Your change request was received.",
      });
    } catch (error) {
      setChangeStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to submit change request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reservation-page">
      <section className="reservation-lookup-panel" aria-labelledby="reservation-title">
        <p className="eyebrow">EZ Black Car Reservation</p>
        <h1 id="reservation-title">Reservation Details</h1>
        {status.message ? <p className={`form-status ${status.tone}`}>{status.message}</p> : null}
        {!reservation && !status.message ? <p className="form-status">Loading reservation...</p> : null}

        {reservation ? (
          <>
            <div className="authorization-step-panel reservation-detail-panel">
              <div className="authorization-step-icon">
                <CreditCard size={26} aria-hidden="true" />
              </div>
              <div className="authorization-step-copy">
                <span className="authorization-step-kicker">Authorization</span>
                <h2>{reservation.reservationStatus}</h2>
                <p>
                  Your card authorization was received securely. EZ Black Car will review this trip and send
                  final confirmation by email or text.
                </p>
              </div>
              <div className="authorization-step-details" aria-label="Reservation details">
                <div>
                  <span>Amount Authorized</span>
                  <strong>{formatMoney(reservation.amountAuthorized)}</strong>
                </div>
                <div>
                  <span>Card Status</span>
                  <strong>{reservation.paymentStatus}</strong>
                </div>
                <div>
                  <span>Authorization Reference</span>
                  <strong>{reservation.authorizationReference || "Pending"}</strong>
                </div>
              </div>
              {changeStatus.message ? <p className={`form-status ${changeStatus.tone}`}>{changeStatus.message}</p> : null}
            </div>

            <div className="reservation-detail-grid">
              <article>
                <UserRound size={24} aria-hidden="true" />
                <span>Passenger</span>
                <strong>{reservation.customerName || "Pending"}</strong>
                <small>{reservation.email}</small>
              </article>
              <article>
                <Mail size={24} aria-hidden="true" />
                <span>Date & Time</span>
                <strong>{formatDateTime(reservation.pickupDate, reservation.pickupTime)}</strong>
                <small>{reservation.passengers || 1} passenger{Number(reservation.passengers) === 1 ? "" : "s"}</small>
              </article>
              <article>
                <MapPin size={24} aria-hidden="true" />
                <span>Pickup</span>
                <strong>{reservation.pickupLocation || "Pending"}</strong>
              </article>
              <article>
                <Route size={24} aria-hidden="true" />
                <span>Destination</span>
                <strong>{reservation.destination || "Pending"}</strong>
              </article>
            </div>

            <div className="reservation-change-card">
              <div>
                <h2>Need to request a change?</h2>
                <p>
                  Submit the request here. It will not update the trip automatically; EZ Black Car will review
                  timing, availability, pricing, and authorization before making changes.
                </p>
              </div>
              <button type="button" className="button dark reservation-secondary-action" onClick={() => setShowChangeRequest(true)}>
                Request a Change
              </button>
            </div>
          </>
        ) : null}
      </section>

      {showChangeRequest ? (
        <div className="quote-modal-backdrop" role="presentation">
          <form className="quote-modal quote-change-modal" role="dialog" aria-modal="true" aria-labelledby="change-request-title" onSubmit={submitChangeRequest}>
            <h4 id="change-request-title">Request a Trip Change</h4>
            <p>
              Tell us what changed. This request will be reviewed before your reservation, pricing,
              or authorization is updated.
            </p>
            <label className="quote-modal-field">
              <span>Change Type</span>
              <select name="changeType" value={changeRequest.changeType} onChange={updateChangeRequest}>
                <option>Pickup time</option>
                <option>Pickup location</option>
                <option>Destination</option>
                <option>Passenger or luggage count</option>
                <option>Flight details</option>
                <option>Medical or emergency situation</option>
                <option>Other</option>
              </select>
            </label>
            <label className="quote-modal-field">
              <span>What needs to change?</span>
              <textarea
                name="message"
                value={changeRequest.message}
                onChange={updateChangeRequest}
                maxLength={600}
                placeholder="Example: Passenger is experiencing a medical emergency and we need to move pickup earlier."
              />
              <small>{changeRequest.message.length}/600</small>
            </label>
            {changeStatus.message ? <p className={`form-status ${changeStatus.tone}`}>{changeStatus.message}</p> : null}
            <div className="quote-modal-actions">
              <button
                type="button"
                className="button quote-modal-cancel"
                onClick={() => {
                  setShowChangeRequest(false);
                  setChangeStatus({ tone: "", message: "" });
                }}
              >
                Cancel
              </button>
              <button type="submit" className="button dark quote-modal-confirm" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
