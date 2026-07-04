# AI Travel Marketplace Frontend

React/Vite frontend for the AI Travel Marketplace, a travel booking marketplace for stays, tours, experiences, restaurants, vehicles, checkout, payments, reviews, provider dashboards, and admin workflows.

## Main Features

- Public marketplace landing, explore/search, category browsing, and listing detail pages.
- Premium listing detail UI with image gallery, booking card, reviews, and add-to-cart flows.
- Customer checkout, cart, profile, bookings, payment, and review workflows.
- Provider and admin-facing navigation areas.
- JWT-based authenticated API calls with token refresh handling.
- Responsive marketplace UI built with Tailwind CSS and reusable components.

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- React Router
- Axios
- TanStack React Query
- React Hook Form
- Zod
- Framer Motion
- Lucide React
- clsx and tailwind-merge

## Project Structure

```text
frontend/
  public/                Static public assets
  src/
    components/          Shared UI and feature components
    context/             Auth and app context providers
    lib/                 Utility helpers
    pages/               Route-level pages
    routes/              Route definitions and guards
    services/            Axios API clients
    types/               Shared TypeScript types
  index.html
  package.json
  tailwind.config.js
  vite.config.ts
```

## Environment Variables

Create a local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Available variable:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

`VITE_API_BASE_URL` represents the backend API base URL for deployments that use an absolute API URL. The current Axios client uses the relative base path `/api/v1`, and Vite proxies `/api` to the backend during local development. For production, either configure a platform rewrite/proxy for `/api/*` or adapt the API client to use `import.meta.env.VITE_API_BASE_URL`.

Do not commit real production secrets or private backend URLs.

## Installation

```powershell
cd frontend
npm install
```

## Development

Start the Vite development server:

```powershell
npm run dev
```

Default URL:

```text
http://localhost:5173
```

The local Vite proxy sends `/api/*` requests to:

```text
http://localhost:8080
```

Make sure the backend is running before testing authenticated or data-driven pages.

## Build

```powershell
npm run build
```

The production files are written to `dist/`.

## Preview Production Build

```powershell
npm run preview
```

## API Connection

The frontend API client is located at:

```text
src/services/api.ts
```

It uses Axios with:

- Base path: `/api/v1`
- JSON requests
- `withCredentials: true`
- `Authorization: Bearer <access_token>` when an access token exists in local storage
- Refresh-token retry handling for expired access tokens

For local development, Vite proxies requests from `/api` to `http://localhost:8080`.

## Deployment Notes

### Vercel

Recommended setup:

1. Set the project root to `frontend`.
2. Install command: `npm install`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add a rewrite so frontend `/api/*` calls reach the backend.

Example `vercel.json` if deploying the frontend separately:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url.com/api/$1"
    }
  ]
}
```

If you switch the Axios client to an absolute URL, set:

```text
VITE_API_BASE_URL=https://your-backend-url.com/api/v1
```

### CORS

When the frontend and backend are on different domains, the backend must allow the frontend origin and credentials.

## Common Troubleshooting

- API calls fail locally: confirm the backend is running on `http://localhost:8080`.
- Login works but protected calls fail: clear stale `access_token` and `refresh_token` from browser local storage and log in again.
- CORS error in production: add the deployed frontend URL to backend CORS configuration.
- Blank data pages: confirm the backend database has Flyway seed/demo data and listings are `ACTIVE`.
- Build fails after dependency changes: delete `node_modules`, reinstall with `npm install`, then run `npm run build`.

