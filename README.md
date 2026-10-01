# Anas Mohamed Portfolio Demos

Nine self-initiated frontend concepts built with vanilla HTML, CSS, and JavaScript. All sample content is illustrative; these are not presented as commissioned client work.

## Requirements

- Node.js 22.13 or newer. There are no npm runtime dependencies.

## Run locally

```sh
npm run dev
```

Open <http://localhost:4173/>. Set `PORT` to use a different port.

The portfolio links to these demos:

- `/demos/orbit-finance/` - personal finance dashboard, transactions, and budgets
- `/demos/field-notes/` - product catalog, local cart, and simulated checkout
- `/demos/common-ground/` - sample availability and session bookings
- `/demos/taskline/` - task board and workflow movement
- `/demos/gather/` - sample events and RSVPs
- `/demos/waypoint/` - day-by-day itinerary
- `/demos/greenhouse/` - plant care and watering log
- `/demos/pageturn/` - reading list and progress
- `/demos/helpdesk/` - support ticket queue

## Data and reset

Each demo stores its changes in the visitor's browser `localStorage`, in a separate namespace per demo. Data is private to that browser profile and does not sync between devices or visitors. The **Reset demo** button restores illustrative seed records. The Field Notes checkout is simulated and does not collect payment details. Booking, RSVP, and support actions stay local; they do not send external messages.

To clear an individual demo's local data, use its **Reset demo** button. Clearing site data in the browser removes all demo edits.

## Tests

```sh
npm test
```

The API tests cover the optional local SQLite development API: seed isolation, create/update/delete, reset, empty collections, validation, and unknown routes.

This app is a concept-demo portfolio, not a production service for real customer or financial data.

## Vercel deployment

The frontend exports as a static site. Build it with:

```sh
npm run build
```

Vercel uses `vercel.json` to publish `dist/`. Connect the GitHub repository to Vercel and deploy; subsequent pushes to `main` will trigger deployments. The demos remain client-side and require no paid database or serverless functions. Do not store real customer or financial information in these concept demos.

`vercel.json` sets `cleanUrls` with `trailingSlash: false`, so demo links are written as `/demos/<name>` without a trailing slash and resolve directly. Demo pages load their assets from root-relative paths (`/demos/shared/...`) so the same files work both from the local dev server and from the built `dist/` output.
