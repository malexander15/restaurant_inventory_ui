# Restaurant Inventory UI

A Next.js frontend for interacting with the Restaurant Inventory API.

This project is a frontend client built with Next.js that consumes a Rails API
to manage restaurant inventory, recipes, and stock depletion.

The UI is intentionally decoupled from the backend and communicates exclusively
via HTTP requests to a versioned REST API.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Fetch API

## Backend Dependency

This UI depends on the Restaurant Inventory API.

The backend must be running locally for the UI to function.

Default backend URL:
```
http://localhost:3001/api/v1
```

## Running the Project

```bash
git clone git@github.com:yourusername/restaurant_inventory_ui.git
cd restaurant_inventory_ui
npm install
npm run dev
```

### The App will be available at:
```
http://localhost:3000
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Project Structure
```
- `app/` – Next.js App Router pages
- `app/products` – Product listing UI
- `public/` – Static assets
```