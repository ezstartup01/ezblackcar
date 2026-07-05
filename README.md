# EZ Black Car

React/Vite website for EZ Black Car, ready for Vercel deployment.

## Local development

```powershell
npm.cmd install
npm.cmd run dev -- --port 5173
```

## Supabase

Create the `quote_requests` table by running:

```text
supabase-quote-requests.sql
```

Required environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_MAPBOX_ACCESS_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MAPBOX_ACCESS_TOKEN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM_EMAIL=
CORPORATE_INQUIRY_ALERT_EMAIL=
CONTACT_MESSAGE_ALERT_EMAIL=
```

## Mapbox distance fallback

The quote engine uses Mapbox as a fallback when a trip does not match a configured quote zone.

1. Create a public token in Mapbox.
2. Add `VITE_MAPBOX_ACCESS_TOKEN` to `.env.local`.
3. Add the same variable in Vercel for Production and Preview.

The app geocodes pickup and destination addresses, then requests a driving route and uses the returned distance and duration to estimate the quote.

## Server Quote API

The instant quote flow now uses `api/quote.js` so route distance, duration, and launch pricing can run server-side.

Server/runtime environment variables:

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. `MAPBOX_ACCESS_TOKEN`
4. `SMTP_HOST`
5. `SMTP_PORT`
6. `SMTP_USER`
7. `SMTP_PASS`
8. `SMTP_SECURE`
9. `SMTP_FROM_EMAIL`
10. `CORPORATE_INQUIRY_ALERT_EMAIL`
11. `CONTACT_MESSAGE_ALERT_EMAIL` optional; falls back to `CORPORATE_INQUIRY_ALERT_EMAIL`

Client-side `VITE_*` variables are still used for browser features such as address autocomplete.

## Corporate inquiry email workflow

The corporate account inquiry form now calls the Supabase Edge Function:

`supabase/functions/corporate-inquiry`

That function:

1. saves the inquiry to Supabase
2. sends a confirmation email to the client
3. sends an internal alert email to the business inbox

Required Supabase Edge Function secrets:

- `SMTP_HOST`: your SiteGround mail server host
- `SMTP_PORT`: usually `465` or `587`
- `SMTP_USER`: `info@ezblackcar.com`
- `SMTP_PASS`: mailbox password
- `SMTP_SECURE`: `true` for SSL/465, `false` for STARTTLS/587
- `SMTP_FROM_EMAIL`: `info@ezblackcar.com`
- `CORPORATE_INQUIRY_ALERT_EMAIL`: inbox that should receive lead alerts
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Deploy and set secrets with the Supabase dashboard or CLI before testing in production.

## Contact/support message workflow

The `/contact` page includes a support form that posts to:

`api/contact-message.js`

That route:

1. saves the message to `public.contact_messages`
2. sends a confirmation email to the customer
3. sends an internal alert email to the business inbox

Run the contact message migration before relying on the form in production:

```text
supabase/migrations/20260704214500_create_contact_messages.sql
```

## Production deployment

One-command production deployment is available now:

```powershell
npm.cmd run deploy:prod
```

This does three things:

1. builds the app
2. deploys the `corporate-inquiry` Supabase Edge Function
3. deploys the production site to Vercel

Useful variants:

```powershell
npm.cmd run deploy:function
npm.cmd run deploy:web
```

### One-time local setup for future deploys

Persist your Supabase access token once in Windows so future terminals inherit it:

```powershell
setx SUPABASE_ACCESS_TOKEN "your-real-supabase-token"
```

After running `setx`, close PowerShell and open a new terminal before deploying.

### Deployment prerequisites

- repo already linked to Vercel
- Supabase Edge Function secrets already configured
- `SUPABASE_ACCESS_TOKEN` available in the terminal session
