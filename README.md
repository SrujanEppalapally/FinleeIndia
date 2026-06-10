# Finley — Personal Finance for India

A React + TypeScript web application for tracking income, expenses, budgets, net worth, and running financial calculators.

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` (Vite default).

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Backend API base URL (FastAPI)
VITE_API_URL=http://localhost:8000

# Supabase (already provisioned)
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Note:** This project uses [Vite](https://vitejs.dev/), so environment variables must be prefixed with `VITE_` (not `REACT_APP_` as in Create React App). The `VITE_API_URL` variable is read in `src/api/client.ts`.

## Backend

The API service layer expects a **FastAPI** backend running on port **8000**.

### Required Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Email + password login → returns `{ token, user }` |
| POST | `/auth/register` | New user registration → returns `{ token, user }` |
| POST | `/auth/forgot-password` | Send OTP to email |
| POST | `/auth/verify-otp` | Verify 6-digit OTP |
| POST | `/auth/reset-password` | Set new password after OTP verified |
| GET | `/transactions` | List transactions (filters: `month`, `category`, `type`, `search`) |
| POST | `/transactions` | Create transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| GET | `/budget` | List budget categories for a month (`?month=2026-06`) |
| PUT | `/budget/:id` | Update budget limit |
| GET | `/networth` | Full net worth snapshot |
| POST | `/networth/items` | Add asset or liability |
| PUT | `/networth/items/:id` | Update item value |
| DELETE | `/networth/items/:id` | Delete item |
| POST | `/calculators/sip` | SIP projection |
| POST | `/calculators/emi` | EMI + amortization |
| POST | `/calculators/retirement` | Retirement corpus |
| POST | `/calculators/ctc-inhand` | CTC to in-hand breakdown |
| POST | `/calculators/tax-regime` | Old vs new tax regime comparison |

## Authentication

The app uses **JWT Bearer tokens**:

- Tokens are stored in an **in-memory variable** (`src/api/client.ts`) — never in `localStorage` or cookies, preventing XSS token theft.
- Every request automatically attaches `Authorization: Bearer <token>` via an Axios request interceptor.
- A response interceptor catches `401` responses, clears the token, and redirects to `/login`.
- On page refresh the token is lost and the user must log in again (by design for this security model).

## Project Structure

```
src/
  api/            # API service functions (not yet wired to UI)
    client.ts     # Axios instance + interceptors
    auth.ts
    transactions.ts
    budget.ts
    networth.ts
    calculators.ts
  hooks/          # Custom hooks returning mock data (TODO: wire to API)
    useTransactions.ts
    useBudget.ts
    useNetWorth.ts
  constants/
    categories.ts # Default category definitions (name, color, icon)
  contexts/       # React context providers
  components/ui/  # Shared UI components
  pages/          # Route-level page components
  layouts/        # App shell, sidebar, bottom tab bar
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type check without emitting |
| `npm run lint` | ESLint |
