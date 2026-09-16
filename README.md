# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


This app uses Microsoft Entra ID for sign-in. A successful Microsoft login is not enough by itself: the signed-in identity token is sent to the backend, which must validate it and compare the user's `oid` or email with the dashboard database.

The frontend currently uses the legacy ADAL.js v1 implicit flow with a popup because this application explicitly requires ADAL. ADAL is retired by Microsoft; MSAL is recommended for new production work.

## Run locally

1. Copy `.env.example` to `.env` and set the redirect URI registered in the Entra app registration.
2. Run `npm install` and `npm run dev`.
3. Register `http://localhost:5173` as a Single-page application redirect URI in Entra ID. The slash matters: Azure compares this value exactly.

For the Vercel deployment, set these Vercel environment variables and redeploy:

```text
VITE_REDIRECT_URI=https://dashboard-acen-new.vercel.app
VITE_BASE_PATH=/
```

For the old production deployment, use `VITE_BASE_PATH=/dashbuild/` and `VITE_REDIRECT_URI=https://www.etmsdrive.in/dashbuild/`. Register the exact URI used by each deployment. ADAL uses the tenant v1 authority `https://login.microsoftonline.com/f3211d0e-125b-42c3-86db-322b19a65a22`.

## Backend contract

The frontend calls `POST /api/auth/authorize` with:

```json
{ "idToken": "<microsoft-id-token>" }
```

The backend must validate the token signature, issuer, tenant, audience (`b55a7b4d-6fad-4f22-bb96-1f4ad1987818`), expiry, and nonce as appropriate. Then compare a stable claim such as `oid` against the users table. Never put database credentials or the database comparison in this React app.

For an approved user return `200`:

```json
{ "authorized": true, "user": { "name": "User name", "username": "user@example.com" } }
```

For a missing or disabled user return `403`:

```json
{ "authorized": false, "message": "This Microsoft account is not registered for the dashboard." }
```

Run `npm run lint` and `npm run build` before deployment.

## AADSTS50011 fix

In Azure Portal open **Microsoft Entra ID > App registrations > the app > Authentication**. Under **Single-page application**, add the exact URI you are using:

- Local: `http://localhost:5173`
- Vercel: `https://dashboard-acen-new.vercel.app`
- Production: `https://www.etmsdrive.in/dashbuild/`

In Azure, add these under **Single-page application**, not Web or Mobile and desktop applications. After saving, redeploy Vercel so it reloads environment variables. A frontend code change cannot authorize a redirect URI that is missing from the Azure app registration.

Because ADAL uses the implicit flow, enable **Access tokens** and **ID tokens** under **Authentication > Implicit grant and hybrid flows** in the Azure app registration. Keep backend token validation enabled; never trust the browser's user profile by itself. Popup mode does not remove Azure redirect URI validation: the exact URI must still be registered.
