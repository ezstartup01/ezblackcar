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

## Latest Git Backup Point

Current pushed commit:

```text
0cceb8b Reduce quote form field height
```

Recent work:

```text
0cceb8b Reduce quote form field height
ce5d4d4 Add structured pickup and destination fields
65163ce Polish quote form warning UI
92d4baa Add pickup date time validation
0c697e5 Add instant quote engine
```

Note: `Reservation/` is currently untracked and was intentionally left untouched.

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

## Quote Form Behavior

The public form now uses structured pickup and destination logic.

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

Other fields:

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
- `src/data/defaultQuoteData.js`

Rules implemented:

- DTW airport pickup to Downtown Detroit test quote: `$130`
- Downtown Detroit to DTW airport drop-off test quote: `$115`
- Same ZIP address-to-address test quote: `$95`
- Pickup under 3 hours becomes `manual_review`
- Pickup under 3 hours shows centered bold warning/call message
- Flight number only appears for airport pickup
- Same pickup/destination airport is prevented
- If Mapbox token is later added, unknown address routes can use distance fallback

Mapbox planned env var:

```text
VITE_MAPBOX_ACCESS_TOKEN
```

## Design / UI Notes

Recent visual fixes:

- Removed duplicate icons from native date/time fields
- Warning message is centered, larger, and bold
- Quote form field height reduced:
  - Field height: `50px`
  - Submit button: `44px`
  - Row gap tightened

## Tomorrow Suggested Next Steps

1. Manually test `https://ezblackcar.com/#quote-form`.
2. Check that date/time picker UI feels good on desktop and mobile.
3. Review the structured form layout after Vercel deployment.
4. Decide whether to add Mapbox now or after finalizing the form UX.
5. If adding Mapbox:
   - create free Mapbox account
   - restrict public token by domain
   - add `VITE_MAPBOX_ACCESS_TOKEN` to Vercel and `.env.local`
   - test unknown address distance quote
6. Later improvement: move quote calculation to a Vercel API route so Mapbox and future business logic are server-side.

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
