import { useEffect, useState } from "react";
import { CreditCard, Mail, MapPin, Route, UserRound } from "lucide-react";

const initialChangeRequest = {
  pickupDate: "",
  pickupTime: "",
  pickupLocation: "",
  destination: "",
  passengers: "1",
  luggageCount: "",
  flightNumber: "",
  message: "",
};

function formatMoney(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2).replace(/\.00$/, "")}` : "Pending";
}

function formatDateTime(date, time) {
  return [date, time].filter(Boolean).join(" • ") || "Pending";
}

function buildInitialChangeRequest(reservation) {
  return {
    pickupDate: reservation.pickupDate || "",
    pickupTime: reservation.pickupTime || "",
    pickupLocation: reservation.pickupLocation || "",
    destination: reservation.destination || "",
    passengers: String(reservation.passengers || "1"),
    luggageCount: reservation.luggageCount ? String(reservation.luggageCount) : "",
    flightNumber: reservation.flightNumber || "",
    message: "",
  };
}

export default function ReservationPage({ token }) {
  const [reservation, setReservation] = useState(null);
  const [status, setStatus] = useState({ tone: "", message: "" });
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

        if (!ignore) {
          setReservation(payload.reservation);
          setChangeRequest(buildInitialChangeRequest(payload.reservation));
        }
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

    if (!changeRequest.pickupDate || !changeRequest.pickupTime || !changeRequest.pickupLocation.trim() || !changeRequest.destination.trim()) {
      setChangeStatus({
        tone: "warning",
        message: "Please keep pickup date, pickup time, pickup location, and destination on the request.",
      });
      return;
    }

    if (!changeRequest.message.trim()) {
      setChangeStatus({
        tone: "warning",
        message: "Please add a short note explaining what changed.",
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
          changeType: "Reservation detail update",
          requestedDetails: changeRequest,
          message: changeRequest.message,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to submit change request.");
      }

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

            <form className="reservation-change-form" aria-labelledby="change-request-title" onSubmit={submitChangeRequest}>
              <div className="reservation-change-heading">
                <div>
                  <p className="eyebrow">Request Changes</p>
                  <h2 id="change-request-title">Need to change this trip?</h2>
                  <p>
                    Update the fields below and submit the request. This does not change your reservation automatically.
                  </p>
                </div>
              </div>

              <div className="reservation-change-grid">
                <label>
                  <span>Pickup Date</span>
                  <input name="pickupDate" type="date" value={changeRequest.pickupDate} onChange={updateChangeRequest} />
                </label>
                <label>
                  <span>Pickup Time</span>
                  <input name="pickupTime" type="time" value={changeRequest.pickupTime} onChange={updateChangeRequest} />
                </label>
                <label className="reservation-change-wide">
                  <span>Pickup Location</span>
                  <input name="pickupLocation" value={changeRequest.pickupLocation} onChange={updateChangeRequest} />
                </label>
                <label className="reservation-change-wide">
                  <span>Destination</span>
                  <input name="destination" value={changeRequest.destination} onChange={updateChangeRequest} />
                </label>
                <label>
                  <span>Passengers</span>
                  <input name="passengers" type="number" min="1" max="14" value={changeRequest.passengers} onChange={updateChangeRequest} />
                </label>
                <label>
                  <span>Luggage</span>
                  <input name="luggageCount" type="number" min="0" max="20" value={changeRequest.luggageCount} onChange={updateChangeRequest} />
                </label>
                <label className="reservation-change-wide">
                  <span>Flight Details</span>
                  <input name="flightNumber" value={changeRequest.flightNumber} onChange={updateChangeRequest} placeholder="Airline / flight number" />
                </label>
                <label className="reservation-change-full">
                  <span>Reason / Notes</span>
                  <textarea
                    name="message"
                    value={changeRequest.message}
                    onChange={updateChangeRequest}
                    maxLength={700}
                    placeholder="Tell us what changed or what you need adjusted."
                  />
                  <small>{changeRequest.message.length}/700</small>
                </label>
              </div>

              <div className="reservation-change-submit">
                <p>
                  Submitting this request does not update your reservation automatically. EZ Black Car will review
                  availability, price, timing, and authorization before confirming any change.
                </p>
                <button type="submit" className="button dark reservation-secondary-action" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Change Request"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}
