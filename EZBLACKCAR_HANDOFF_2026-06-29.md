# EZBlackCar Handoff - 2026-06-29

## Current State

- React/Vite site is in `D:\EZBlackCar`.
- GitHub repo: `https://github.com/ezstartup01/ezblackcar`
- Production deploy is handled by Vercel from `main`.
- Live Vercel URL: `https://ezblackcar.vercel.app/`
- Main domain: `https://ezblackcar.com`
- Redirect domains configured in Vercel:
  - `www.ezblackcar.com` -> `ezblackcar.com`
  - `ezblackcars.com` -> `ezblackcar.com`
  - `www.ezblackcars.com` -> `ezblackcar.com`

## Latest Workspace State

Current workspace is ahead of the last pushed backup point and includes substantial uncommitted work.

Last pushed commit:

```text
0cceb8b Reduce quote form field height
```

Current local changes include:

- Quote/reservation multi-step flow in `src/components/QuoteForm.jsx`
- Reservation + authorization UI work in `src/styles.css`
- Local Vite middleware for `/api/quote` in `vite.config.js`
- Server quote route in `api/quote.js`
- Launch pricing module in `src/lib/pricing.js`
- New Supabase migration in `supabase/migrations/20260629170000_launch_competitive_pricing.sql`
- README and env updates for server quote variables

## Supabase

Project URL:

```text
https://kzifdtproibiwprmhtjh.supabase.co
```

Frontend env vars already added locally and in Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Tables in use:

- `quote_requests`
- `quote_zones`
- `quote_rules`

The following structured columns were added manually in Supabase:

```sql
trip_type
pickup_type
pickup_airport
pickup_address
pickup_city
pickup_zip
destination_type
destination_airport
destination_address
destination_city
destination_zip
```

Database verification completed:

- Public read of `quote_zones` works.
- Public read of active `quote_rules` works.
- Public insert into `quote_requests` works.
- Structured quote request insert works after the column patch.

## Quote / Reservation Flow

The quote flow is now effectively a reusable module and should be preserved as a standalone pattern.

Current step model:

1. `Quote`
2. `Reservation`
3. `Authorization`

Current intended business UX:

1. Client creates quote
2. Quote form hides
3. Quote summary + reserve/authorize screen appears
4. `Edit Quote` returns to quote mode and hides reservation screen
5. Client re-generates quote if trip changes
6. `Reserve the Ride` is intended to include authorization
7. Next screen later should be confirmation only

Important current behavior:

- When `Edit Quote` is clicked:
  - quote form reappears
  - reservation/authorization section hides
  - previously entered values remain in session state
- Trip-changing fields invalidate the stored quote and force re-quote
- Quote flow state is cached in `sessionStorage`
- Quote form and reservation flow are both currently in `src/components/QuoteForm.jsx`

## Quote Form Behavior

The public quote form now uses structured pickup and destination logic.

Pickup:

- Pickup Date
- Pickup Time
- Pickup Type:
  - Address / Hotel / Office
  - Airport

If pickup is airport:

- Pickup Airport
- Flight Number optional

If pickup is address:

- Pickup Address
- Pickup City
- Pickup ZIP

Destination:

- Destination Type:
  - Address / Hotel / Office
  - Airport

If destination is airport:

- Destination Airport
- Same airport as pickup is disabled/prevented

If destination is address:

- Destination Address
- Destination City
- Destination ZIP

Other quote fields:

- Phone
- Passengers
- Luggage Count
- Email

Removed:

- Old `Airport Pickup / Drop-off` dropdown
- Generic `Pickup Location`
- Generic `Destination`
- Always-visible flight number

## Quote Logic

Files:

- `src/components/QuoteForm.jsx`
- `src/lib/quoteEngine.js`
- `src/lib/pricing.js`
- `src/data/defaultQuoteData.js`
- `api/quote.js`

Reusable quote module pieces now in place:

- structured quote form UI
- airport/address switching logic
- Mapbox autocomplete wiring
- server-side quote route
- launch pricing calculator
- quote invalidation/session persistence

Current pricing / rules implemented:

- server-side launch competitive quote logic is active
- pickup under 3 hours becomes `manual_review`
- pickup under 3 hours shows centered warning/call message
- flight fields appear only in airport contexts
- same pickup/destination airport is prevented
- Mapbox route distance/duration is used server-side
- quote request inserts tolerate older Supabase schemas by dropping missing fields dynamically

Mapbox env vars in use:

```text
VITE_MAPBOX_ACCESS_TOKEN
MAPBOX_ACCESS_TOKEN
```

Server quote env vars in use:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
MAPBOX_ACCESS_TOKEN
```

## Design / UI Notes

Recent visual fixes:

- Removed duplicate framing from native date/time fields
- Increased field-label font size
- Default passengers set to `1`
- Quote form hides after successful quote
- `Edit Quote` and `Reserve the Ride` now sit together at the bottom of reservation flow
- Quote summary strip replaced the earlier 3-card layout
- Reserve/authorize screen is split into two side-by-side cards:
  - left: contact + notes
  - right: payment authorization fields
- Authorization notice and consent were merged into one compact bottom card
- Reservation summary sidebar was removed as duplicate/wasteful

Current quote summary strip fields:

- Estimate Quote
- Date Time
- Pickup
- Destination
- Other Details

Current reserve/authorize section layout:

- heading centered
- left card:
  - Full Name
  - Phone Number
  - Email Address
  - Special Instructions / Notes
- right card:
  - Cardholder Name
  - Card Number
  - Expiration Date
  - CVC
  - Billing ZIP Code
- bottom merged authorization card:
  - authorization copy
  - consent checkbox
- bottom action row:
  - Edit Quote
  - Reserve the Ride

Known UI state at handoff:

- User generally likes the quote module now
- Summary strip can still be polished later
- Reservation screen layout is close, but may still need visual refinement tomorrow
- Actual payment processor is not integrated yet; fields are UI only
- Confirmation screen is not yet implemented as final UX

## Tomorrow Suggested Next Steps

1. Final polish pass on reservation/authorization layout.
2. Decide whether to freeze the quote summary strip design or replace it later.
3. Integrate real payment authorization provider into the existing reserve screen.
4. Implement confirmation screen only after authorization wiring is real.
5. Add staff/client notification flow after reservation submission.
6. If desired, refactor quote flow into a reusable module/component boundary after UI stabilizes.

## Important Resume Notes

- Do not rebuild the quote logic from scratch; the current quote module is the strongest reusable piece and should be preserved.
- If resuming UI work tomorrow, start in:
  - `src/components/QuoteForm.jsx`
  - `src/styles.css`
- If resuming pricing/server work tomorrow, start in:
  - `api/quote.js`
  - `src/lib/pricing.js`
  - `vite.config.js`

## Commands

Build:

```powershell
npm.cmd run build
```

Run local dev:

```powershell
npm.cmd run dev
```

Check git:

```powershell
git status -sb
git log --oneline -5
```
