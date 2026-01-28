# Restaurant Inventory UI

A production-grade Next.js frontend for managing restaurant inventory, recipes, and stock movement, backed by a Rails API.

### This application provides a complete UI for:

- Managing products and recipes

- Replenishing inventory (manual, barcode, CSV)

- Depleting inventory from menu item sales (manual, CSV, or combined)

- Authenticated access with route protection

- Fully tested end-to-end user workflows

### The frontend is fully decoupled from the backend and communicates exclusively via a versioned REST API.

- Tech Stack

- Next.js (App Router)

- React

- TypeScript

- Tailwind CSS

- Material UI (MUI)

- Playwright (E2E testing – Chromium, Firefox, WebKit)

- PapaParse (CSV parsing)

- Fetch API

- Cookie-based authentication

## Backend Dependency

This UI depends on the Restaurant Inventory API.

The backend must be running locally (or deployed) for the UI to function.

Default backend URL:

```http://localhost:3001/api/v1```


Backend repository: <br>
https://github.com/malexander15/restaurant_inventory_api

### Core Features<br>
**Authentication**

- Cookie-based authentication

- Route protection via Next.js middleware

- Server-side redirects (no UI flicker)

- Public /login route with protected app layout

**Products**

- Create, edit, and delete products

- Category, unit, cost, and barcode support

- Optimistic UI updates

- Inventory Replenishment

- Manual replenish via product selection

- Barcode-based replenish

- Recognized barcodes

- Unrecognized barcode → product creation flow

- Combined replenish + product creation

- Staged inventory updates with confirmation

  **Filtering by:**

    - Name

    - Category

    - Unit

    - Cost

    - Search Bar


**Recipes**

- Create menu items and prepped items

- Edit recipe name and type

- Edit recipe ingredients independently

- Delete recipes with confirmation

- Fully tested CRUD flows

- Inventory Depletion

- Manual depletion via menu item selection

- CSV POS sales report upload

- Automatic matching of CSV rows to menu items

- Combined manual + CSV depletion

- Confirmation dialog for irreversible actions

  **Filtering by:**

    - Name

    - Recipe Type

    - Search Bar

### Testing

This project uses Playwright end-to-end testing to validate real user behavior.

**Test coverage includes:**

  - Authentication and redirects

  - Product CRUD flows

  - Recipe CRUD and ingredient editing

    **Replenishment flows:**

    - Manual

    - Barcode

    - Combined

    **Depletion flows:**

    - Manual

    - CSV

    - Combined

    **Cross-browser support:**

    - Chromium

    - Firefox

    - WebKit

**Running the Project Locally:**<br>
git clone git@github.com:yourusername/restaurant_inventory_ui.git<br>
`cd restaurant_inventory_ui`<br>
`npm install`<br>
`npm run dev`<br>

**Run tests locally**<br>
`npx playwright test`


The app will be available at:

`http://localhost:3000`

Environment Variables

Create a `.env.local` file in the project root:

`NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

Project Structure (High Level)<br>
```
app/
  (auth)/            # Login route
  (app)/             # Protected application routes
    products/        # Product UI
    recipes/         # Recipes, replenish, deplete
  components/        # Shared UI components
  lib/               # API helpers
middleware.ts        # Auth route protection
e2e/                 # Playwright tests and helpers
```

## Future Improvements

- CI via GitHub Actions (run Playwright on PRs)

- Role-based permissions

- Low-stock alerts

- Production deployment

- Vercel (frontend)

- Hosted API (backend)

- Inventory audit logs

## Why This Project Exists

This project was built to model real restaurant operations, not demo CRUD screens.

**The focus is on:**

- Realistic workflows (CSV uploads, barcode scans)

- Correctness over shortcuts

- Testable, maintainable frontend architecture

- Clean separation between UI and API