# EZBlackCar Handoff - 2026-07-01

## Current State

- React/Vite site is in `D:\EZBlackCar`.
- GitHub repo: `https://github.com/ezstartup01/ezblackcar`
- Production site is live at `https://www.ezblackcar.com`
- Vercel project is linked locally through `.vercel/project.json`
- Supabase project URL: `https://kzifdtproibiwprmhtjh.supabase.co`

## Major Progress Completed

### Homepage / site structure

- Homepage sections were heavily expanded and refined.
- FAQ section was added and wired through reusable content.
- Legal page content and metadata structure were added.
- Corporate inquiry section was redesigned and integrated into the homepage.

### SEO work

- Homepage metadata improved
- Canonical / OG / Twitter metadata improved
- `LocalBusiness` and `FAQPage` structured data added
- SEO audit tracker created in:
  - `SEO_AUDIT_LOG.md`

### Corporate inquiry workflow

The corporate account inquiry flow is now live end-to-end.

Current behavior:

1. Client submits the corporate inquiry form
2. Form calls Supabase Edge Function `corporate-inquiry`
3. Inquiry is saved to `public.corporate_inquiries`
4. Client receives confirmation email
5. Business inbox receives inquiry alert email

Relevant files:

- `src/components/CorporateInquiryForm.jsx`
- `supabase/functions/corporate-inquiry/index.ts`
- `supabase/migrations/20260629200000_create_corporate_inquiries.sql`

### Email / DNS / SMTP

- Domain remains on GoDaddy
- Website remains on Vercel
- Email is handled through SiteGround
- Mailbox `info@ezblackcar.com` is working
- SiteGround SMTP settings used:
  - host: `giowm1290.siteground.biz`
  - port: `465`
  - secure: `true`

### Supabase Edge Function secrets configured

Custom secrets confirmed in Supabase:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `SMTP_FROM_EMAIL`
- `CORPORATE_INQUIRY_ALERT_EMAIL`

Default Supabase secrets already available to functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deployment workflow

A repeatable production deployment helper was added.

Files:

- `scripts/deploy-production.mjs`
- `package.json`
- `README.md`

Available commands:

```powershell
npm.cmd run deploy:prod
npm.cmd run deploy:function
npm.cmd run deploy:web
```

`deploy:prod` does:

1. build the app
2. deploy the Supabase function
3. deploy Vercel production

## Production Verification Completed

- Supabase Edge Function `corporate-inquiry` deployed successfully
- Vercel production deploy completed successfully
- Corporate inquiry flow confirmed working live

## Current Known Gaps

### High priority business/SEO

- Real business phone number is still missing in site content
- Footer social links still use placeholders
- GA4 / Google Ads conversion tracking still not added

### Product / workflow

- Quote flow still needs future payment/authorization completion
- Corporate workflow does not yet have admin dashboard/status management
- No CRM-style inquiry pipeline yet

## Recommended Next Steps

1. Add real business phone number everywhere
2. Add real social profile links or hide placeholders
3. Add Google tag / GA4 / Ads conversion tracking
4. Create dedicated Corporate Accounts work thread if deeper admin workflow is next
5. Decide whether to build:
   - DTW Airport Transfers page
   - Corporate Transportation page
   - Executive SUV Service page

## Important Resume Notes

- Corporate inquiry emails are no longer dependent on Vercel env vars
- The working email path is Supabase Edge Function based
- For future deploys, prefer:

```powershell
npm.cmd run deploy:prod
```

- If Supabase deploy fails in a new terminal, first make sure:

```powershell
setx SUPABASE_ACCESS_TOKEN "your-real-supabase-token"
```

Then reopen terminal and retry.

## Useful Files

- `README.md`
- `SEO_AUDIT_LOG.md`
- `src/components/CorporateInquiryForm.jsx`
- `supabase/functions/corporate-inquiry/index.ts`
- `scripts/deploy-production.mjs`

