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
```
