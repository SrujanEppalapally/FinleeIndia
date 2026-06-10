# Finley — Knowledge Transfer Document

> **For:** New engineers joining the project  
> **Status:** MVP in active development  
> **Last updated:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Local Setup Guide](#4-local-setup-guide)
5. [Application Architecture](#5-application-architecture)
6. [Screen Inventory](#6-screen-inventory)
7. [Component Library](#7-component-library)
8. [Calculator Modules](#8-calculator-modules)
9. [Goals Module](#9-goals-module)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Data Models](#11-data-models)
12. [Coding Conventions](#12-coding-conventions)
13. [Known Issues & TODO List](#13-known-issues--todo-list)
14. [Roadmap](#14-roadmap)
15. [Contact & Resources](#15-contact--resources)

---

## 1. Project Overview

### What is Finley?

Finley is a **personal finance management web app** built for Indian users. It helps individuals track income and expenses, manage monthly budgets, monitor net worth, plan financial goals, and use India-specific calculators — all in one place.

### Target Audience & User Persona

| Attribute | Detail |
|-----------|--------|
| Age | 24–40 |
| Income segment | Salaried professionals, ₹8L–₹30L CTC |
| Location | Tier-1 and Tier-2 Indian cities |
| Pain point | No single tool that combines tracking + planning + India-specific calculators |
| Example persona | "Priya, 28, software engineer in Bengaluru, earning ₹14 LPA, wants to buy a house in 5 years and retire at 45" |

### Core Value Proposition

- **Track:** Manual transaction entry with category tagging and budget alerts
- **Plan:** Goal tracker with progress visualisation and monthly contribution planning
- **Calculate:** 12 India-specific financial calculators (SIP, EMI, FIRE, CTC in-hand, Tax regime, etc.)
- **Understand:** Net worth dashboard with asset/liability breakdown and future projection

### Current Status

MVP in development. Frontend is largely complete with mock data. Backend API is built and ready for integration. The frontend-to-backend wiring is the next major milestone.

---

## 2. Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 (with Vite) |
| Language | TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| HTTP client | Axios |
| Icons | Lucide React |

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | Python FastAPI 0.111 |
| Language | Python 3.10+ |
| Database | PostgreSQL (via SQLAlchemy 2.0) |
| Migrations | Alembic 1.13 |
| Auth | JWT (python-jose) + bcrypt password hashing |
| Validation | Pydantic v2 |
| Server | Uvicorn |

### Auth

JWT Bearer token auth. Tokens are issued at login, stored **in memory only** (never localStorage or cookies), and attached to every API request via an Axios request interceptor.

### Planned Integrations (not yet built)

| Integration | Purpose | Status |
|------------|---------|--------|
| RBI Account Aggregator (AA) | Automatic bank transaction sync | Pending FIU registration |
| CallMeBot WhatsApp API | Budget alerts, weekly summaries | Planned for v2 |

### Dev Tools

- **IDE:** PyCharm (backend), VS Code (frontend)
- **Version control:** Git / GitHub
- **API testing:** curl, Postman, or FastAPI's built-in `/docs` (Swagger UI)

---

## 3. Repository Structure

```
finley/
├── src/                          # React frontend
│   ├── api/                      # Axios service functions (one file per domain)
│   │   ├── client.ts             # Axios instance, token management, interceptors
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── budget.ts
│   │   ├── networth.ts
│   │   └── calculators.ts
│   ├── components/
│   │   └── ui/                   # Shared primitive components (see §7)
│   ├── constants/
│   │   ├── categories.ts         # DEFAULT_CATEGORIES array
│   │   └── goalTypes.ts          # GOAL_TYPES array
│   ├── contexts/
│   │   ├── AuthContext.tsx       # isAuthenticated, login(), logout()
│   │   ├── SidebarContext.tsx    # Mobile sidebar open/close state
│   │   ├── ToastContext.tsx      # showToast() global notifications
│   │   └── TopBarActionsContext.tsx  # Inject TopBar right-side actions per page
│   ├── hooks/
│   │   ├── useBudget.ts
│   │   ├── useNetWorth.ts
│   │   └── useTransactions.ts
│   ├── layouts/
│   │   ├── AppShell.tsx          # Main authenticated layout (Sidebar + TopBar + Outlet)
│   │   ├── AuthLayout.tsx        # Centered card layout for auth pages
│   │   ├── BottomTabBar.tsx      # Mobile bottom nav (≤768px)
│   │   ├── Sidebar.tsx           # Desktop sidebar navigation
│   │   ├── SettingsLayout.tsx    # Settings section layout
│   │   └── TopBar.tsx            # Top header bar with page title + actions slot
│   ├── pages/
│   │   ├── auth/                 # LoginPage, RegisterPage, ForgotPasswordPage
│   │   └── app/
│   │       ├── DashboardPage.tsx
│   │       ├── TransactionsPage.tsx
│   │       ├── BudgetPage.tsx
│   │       ├── NetWorthPage.tsx
│   │       ├── CalculatorsPage.tsx
│   │       ├── ProfilePage.tsx
│   │       ├── CategoriesPage.tsx
│   │       ├── goals/
│   │       │   ├── GoalsPage.tsx
│   │       │   ├── GoalDetailPage.tsx
│   │       │   └── goalsData.ts  # Mock goals data + helper functions
│   │       └── calculators/      # One file per calculator (12 total)
│   ├── App.tsx                   # Route definitions
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind directives + global styles
├── backend/
│   ├── main.py                   # FastAPI app, router registration, CORS
│   ├── database.py               # SQLAlchemy engine, session, Base
│   ├── requirements.txt
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── budget.py
│   │   └── networth.py
│   ├── schemas/                  # Pydantic request/response models
│   │   ├── auth.py
│   │   ├── transaction.py
│   │   ├── budget.py
│   │   ├── networth.py
│   │   └── calculators.py
│   ├── routers/                  # FastAPI route handlers
│   │   ├── auth.py
│   │   ├── transactions.py
│   │   ├── budget.py
│   │   ├── networth.py
│   │   ├── calculators.py
│   │   └── deps.py               # Shared dependencies (get_current_user, get_db)
│   └── services/                 # Business logic (auth_service, calculator_service)
│       ├── auth_service.py
│       └── calculator_service.py
├── supabase/
│   └── migrations/               # Supabase SQL migrations
├── .env                          # Environment variables (never commit)
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.app.json
```

### Key Config Files

| File | Purpose |
|------|---------|
| `.env` | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `backend/requirements.txt` | All Python dependencies with pinned versions |
| `tailwind.config.js` | Theme extension (custom shadows, font) |
| `tsconfig.app.json` | TypeScript compiler config for the app |
| `vite.config.ts` | Vite build config |

---

## 4. Local Setup Guide

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+
- Git

---

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd finley
```

---

### Step 2 — Frontend setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

---

### Step 3 — Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/finley
JWT_SECRET=your-very-long-random-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

---

### Step 4 — Create the database

```bash
psql -U postgres
CREATE DATABASE finley;
\q
```

---

### Step 5 — Run database migrations

```bash
# From backend/ directory, with venv active
alembic upgrade head
```

---

### Step 6 — Start the backend

```bash
# From backend/ directory
uvicorn main:app --reload --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

API docs are available at: `http://localhost:8000/docs`

---

### Step 7 — Start the frontend

```bash
# From project root
npm run dev
```

App is available at: `http://localhost:5173`

---

### Step 8 — Verify end-to-end

1. Open `http://localhost:5173`
2. Register a new account at `/register`
3. Log in — you should land on `/dashboard`
4. Check the browser Network tab: API calls should hit `http://localhost:8000`

---

## 5. Application Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────┐
│   React Frontend (Vite, :5173)  │
│   TypeScript + Tailwind CSS     │
└──────────────┬──────────────────┘
               │  HTTP / JSON (Axios)
               │  Authorization: Bearer {JWT}
┌──────────────▼──────────────────┐
│   FastAPI Backend (:8000)       │
│   Python + Pydantic + SQLAlchemy│
└──────────────┬──────────────────┘
               │  SQLAlchemy ORM
┌──────────────▼──────────────────┐
│   PostgreSQL Database           │
│   Tables: users, transactions,  │
│   budget_categories, networth_  │
│   items                         │
└─────────────────────────────────┘
```

### Auth Flow

```
1. User submits email + password on /login
2. POST /auth/login → FastAPI returns { token, user }
3. Frontend calls setToken(token) — stored in module-level variable (in-memory)
4. AuthContext.login() sets isAuthenticated = true
5. All subsequent Axios requests: request interceptor adds
   Authorization: Bearer {token} header automatically
6. On 401 response: interceptor clears token, redirects to /login
7. On logout: token cleared, isAuthenticated = false, redirect /login
```

### Protected Routes

All app pages are wrapped in a `ProtectedRoute` component inside `App.tsx`. If `isAuthenticated` is false, it redirects to `/login`. Auth pages (`/login`, `/register`) redirect to `/dashboard` if already authenticated.

### Top Bar Actions Pattern

Each page can inject custom action buttons into the TopBar right slot:

```tsx
// Inside any page component
const { setActions } = useTopBarActions();

useEffect(() => {
  setActions(<Button onClick={...}>Add Item</Button>);
  return () => setActions(null);   // cleanup on unmount
}, [setActions]);
```

### API Client Pattern

```
Page/Hook
  └── calls apiService function (e.g. transactionsApi.getAll())
        └── calls axios instance from src/api/client.ts
              └── request interceptor adds JWT header
              └── response interceptor handles 401
```

---

## 6. Screen Inventory

### Auth Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/login` | LoginPage | Email + password sign in |
| `/register` | RegisterPage | Name, email, phone, password registration |
| `/forgot-password` | ForgotPasswordPage | OTP-based password reset flow |

### Core App Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/dashboard` | DashboardPage | KPI overview, spending donut, budget, recent transactions, goals summary, quick actions |
| `/transactions` | TransactionsPage | Full transaction list, filters (month/category/type/search), add/edit/delete |
| `/budget` | BudgetPage | Monthly budget limits vs actual spend per category |
| `/networth` | NetWorthPage | Asset & liability tracker, net worth hero, benchmark, future projection chart |
| `/goals` | GoalsPage | Goal cards grid — progress, status, target date |
| `/goals/:id` | GoalDetailPage | Single goal detail — milestones, contribution history, edit |
| `/calculators` | CalculatorsPage | Calculator hub — grid of all 12 calculators |

### Calculator Screens

| Route | Calculator | Category |
|-------|-----------|---------|
| `/calculators/sip` | SIP Calculator | Grow Wealth |
| `/calculators/lumpsum-vs-sip` | Lumpsum vs SIP | Grow Wealth |
| `/calculators/fire` | FIRE Calculator | Grow Wealth |
| `/calculators/retirement` | Retirement Calculator | Grow Wealth |
| `/calculators/rental-yield` | Rental Yield Calculator | Grow Wealth |
| `/calculators/emi` | EMI Calculator | Manage Money |
| `/calculators/ctc-inhand` | CTC In-hand Calculator | Manage Money |
| `/calculators/tax-regime` | Tax Regime Comparator | Manage Money |
| `/calculators/dream-house` | Dream House Planner | Manage Money |
| `/calculators/dream-vehicle` | Dream Vehicle Planner | Manage Money |
| `/calculators/trip-budget` | Trip Budget Planner | Manage Money |
| `/calculators/debt-payoff` | Debt Payoff Calculator | Manage Money |

### Settings Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/settings/profile` | ProfilePage | Name, phone, notification preferences |
| `/settings/categories` | CategoriesPage | Manage custom transaction categories |

---

## 7. Component Library

All shared UI components live in `src/components/ui/` and are exported from `src/components/ui/index.ts`.

### Layer 1 — Primitives

| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `className` | All clickable actions |
| `Input` | `label`, `error`, `type`, standard HTML input props | All text/number inputs |
| `Select` | `label`, `options: {value, label}[]`, `value`, `onChange` | All dropdowns |
| `Badge` | `variant` (green/red/yellow/gray/teal) | Category tags, status labels |
| `Spinner` | — | Loading spinners |
| `Skeleton` | `variant` (card/table-row) | Loading placeholder shimmer |
| `EmptyState` | `icon`, `title`, `description`, `className` | Empty list states |
| `CurrencyDisplay` | `amount: number` | Formats ₹ with lakh/crore notation |
| `KPICard` | `label`, `value`, `delta`, `icon` | Dashboard metric cards |
| `BudgetProgressBar` | `category`, `spent`, `limit` | Budget category progress bars |

### Layer 2 — Layouts

| Component | File | Purpose |
|-----------|------|---------|
| `AppShell` | `layouts/AppShell.tsx` | Root layout for authenticated pages |
| `AuthLayout` | `layouts/AuthLayout.tsx` | Centered card layout for auth pages |
| `Sidebar` | `layouts/Sidebar.tsx` | Desktop left navigation |
| `TopBar` | `layouts/TopBar.tsx` | Sticky page header with title + actions |
| `BottomTabBar` | `layouts/BottomTabBar.tsx` | Mobile bottom navigation (hidden ≥lg) |
| `SettingsLayout` | `layouts/SettingsLayout.tsx` | Settings section sub-layout |

### Layer 3 — Feature Components

These are larger components embedded within page files (co-located, not in `components/ui/`):

| Component | Lives in | Purpose |
|-----------|---------|---------|
| `AddTransactionModal` | `DashboardPage.tsx` | Quick add transaction from dashboard |
| `SetBudgetModal` | `DashboardPage.tsx` | Quick set budget limit |
| `QuickNetWorthModal` | `DashboardPage.tsx` | Quick update net worth values |
| `ItemModal` | `NetWorthPage.tsx` | Add/edit asset or liability |
| `ProjectionSection` | `NetWorthPage.tsx` | Collapsible future net worth chart |
| `GoalCard` | `GoalsPage.tsx` | Individual goal card with progress |
| `GoalSummaryRow` | `DashboardPage.tsx` | Compact goal row for dashboard |
| `ChartTip` | Various calculators | Recharts custom tooltip component |

---

## 8. Calculator Modules

### CalculatorShell Pattern

Every calculator page uses the same two-column layout:

```
┌──────────────────┬──────────────────────────────┐
│  Inputs panel    │  Results panel                │
│  (lg:col-span-2) │  (lg:col-span-3)              │
│                  │  KPI cards + chart            │
└──────────────────┴──────────────────────────────┘
```

- All calculators compute **client-side in JavaScript** (no API call for the calculation itself)
- Backend `/calculators/*` endpoints exist but are not wired up yet — see §13
- Each calculator injects an "All Calculators ←" back button via `useTopBarActions`

---

### Calculator Reference

#### SIP Calculator (`/calculators/sip`)

| | Detail |
|-|--------|
| **Inputs** | Monthly investment (₹), Annual return (%), Years, Step-up type (% or fixed ₹), Step-up amount |
| **Outputs** | Total invested, Estimated returns, Maturity value, Wealth ratio (Nx) |
| **Chart** | Area chart: Invested vs Total Value by year |
| **Formula** | FV = P × [((1+r)^n − 1) / r] × (1+r), stepped up annually |

#### Lumpsum vs SIP (`/calculators/lumpsum-vs-sip`)

| | Detail |
|-|--------|
| **Inputs** | Investment amount (₹), Annual return (%), Years |
| **Outputs** | Lumpsum final value vs SIP final value comparison |
| **Chart** | Bar or line comparison chart |

#### FIRE Calculator (`/calculators/fire`)

| | Detail |
|-|--------|
| **Inputs** | Current age, Current annual income (₹), Salary growth (%), Current annual expenses (₹), Current savings (₹), FIRE goal age, Expected return (%), Inflation (%) |
| **Outputs** | Years to retire, Annual expense at retirement (inflation-adjusted), FIRE Number (4% SWR), Projected corpus at FIRE age, Green/red status card |
| **Chart** | Line chart: Corpus growth vs flat FIRE Number line; dot at intersection |
| **Formula** | `FIRE_number = annual_expenses × (1+inf)^years / 0.04`; corpus simulated year-by-year |

#### Retirement Calculator (`/calculators/retirement`)

| | Detail |
|-|--------|
| **Inputs** | Current age, Retirement age, Monthly expenses (₹), Current savings (₹), Return rate (%), Inflation (%) |
| **Outputs** | Corpus required, Monthly savings needed, Projected corpus |
| **Formula** | Inflation-adjusted corpus target; future value of current savings + required monthly SIP |

#### Rental Yield Calculator (`/calculators/rental-yield`)

| | Detail |
|-|--------|
| **Inputs** | Property value (₹), Monthly rent (₹), Annual expenses (₹), Loan amount (₹), Interest rate (%) |
| **Outputs** | Gross yield (%), Net yield (%), Cap rate, Cash-on-cash return |

#### EMI Calculator (`/calculators/emi`)

| | Detail |
|-|--------|
| **Inputs** | Loan amount (₹), Annual interest rate (%), Tenure (years) |
| **Outputs** | Monthly EMI, Total interest, Total payment, Principal/interest split |
| **Chart** | Donut chart: Principal vs Interest |
| **Formula** | `EMI = P × r × (1+r)^n / ((1+r)^n − 1)` where r = monthly rate |

#### CTC In-hand Calculator (`/calculators/ctc-inhand`)

| | Detail |
|-|--------|
| **Inputs** | Annual CTC (₹), PF contribution, Professional tax, Other deductions |
| **Outputs** | Gross monthly, Deductions breakdown, Net monthly take-home, Annual take-home |

#### Tax Regime Comparator (`/calculators/tax-regime`)

| | Detail |
|-|--------|
| **Inputs** | Annual income (₹), HRA received, Rent paid, 80C investments, 80D premium, Other deductions |
| **Outputs** | Old regime tax, New regime tax, Recommendation (which regime saves more), Savings amount |
| **Formula** | Old: 5%/20%/30% slabs with deductions; New: 5%/10%/15%/20%/25%/30% slabs, no deductions |

#### Dream House Planner (`/calculators/dream-house`)

| | Detail |
|-|--------|
| **Inputs** | Target property value (₹), Down payment (%), Current savings (₹), Monthly savings (₹), Return rate (%), Years to goal |
| **Outputs** | Down payment required, Corpus at target date, Gap analysis, EMI estimate |

#### Dream Vehicle Planner (`/calculators/dream-vehicle`)

| | Detail |
|-|--------|
| **Inputs** | Vehicle cost (₹), Down payment (%), Loan tenure, Interest rate |
| **Outputs** | Monthly EMI, Total cost of ownership, Savings plan |

#### Trip Budget Planner (`/calculators/trip-budget`)

| | Detail |
|-|--------|
| **Inputs** | Destination, Travel dates, Number of travellers, Accommodation/flight/food/activities budgets |
| **Outputs** | Total trip cost, Per-person cost, Monthly savings needed, "Add to Goals" button |
| **Special** | "Add to Goals" pre-fills AddGoalModal on the Goals page |

#### Debt Payoff Calculator (`/calculators/debt-payoff`)

| | Detail |
|-|--------|
| **Inputs** | Multiple debts (name, balance, interest rate, minimum payment), extra monthly payment |
| **Outputs** | Payoff timeline, total interest saved, avalanche vs snowball comparison |

---

## 9. Goals Module

### Data Model

```typescript
interface Goal {
  id: string;
  name: string;
  emoji: string;
  type: GoalType;        // 'house' | 'vehicle' | 'travel' | 'education' | 'emergency-fund' | 'retirement' | 'custom'
  targetAmount: number;
  savedAmount: number;
  targetDate: string;    // Format: 'YYYY-MM'
  monthlyContribution: number;
  status: 'on-track' | 'at-risk' | 'behind';
}
```

### Goal Types

| ID | Label | Emoji |
|----|-------|-------|
| `house` | House | 🏠 |
| `vehicle` | Vehicle | 🚗 |
| `travel` | Travel | 🏖️ |
| `education` | Education | 🎓 |
| `emergency-fund` | Emergency Fund | 🛡️ |
| `retirement` | Retirement | 🏡 |
| `custom` | Custom | 🎯 |

### Helper Functions (`src/pages/app/goals/goalsData.ts`)

| Function | Returns | Purpose |
|----------|---------|---------|
| `formatTargetDate(ym)` | `string` | `'2027-03'` → `'March 2027'` |
| `monthsUntil(ym)` | `number` | Months remaining until target date |
| `monthlyNeeded(goal)` | `number` | `(targetAmount - savedAmount) / monthsUntil` |

### Goal Status Logic

- **On Track:** `savedAmount / targetAmount ≥ expected_progress_pct`
- **At Risk:** Below expected progress but less than 25% behind
- **Behind:** More than 25% behind expected progress pace

### "Add to Goals" Flow (Trip Budget Planner)

The Trip Budget Planner calculator has an "Add to Goals" button. When clicked, it navigates to `/goals` and (planned) pre-fills the AddGoalModal with the trip name and calculated cost. Currently implemented as a Link; deep-link pre-fill is on the roadmap.

---

## 10. API Endpoints Reference

**Base URL:** `http://localhost:8000`  
**Auth header:** `Authorization: Bearer {JWT token}` (required on all endpoints except `/auth/*` and `/calculators/*`)

---

### Auth

| Method | Endpoint | Auth | Request Body | Response |
|--------|---------|------|-------------|----------|
| POST | `/auth/register` | None | `{ name, email, phone, password }` | `{ token, user }` (201) |
| POST | `/auth/login` | None | `{ email, password }` | `{ token, user }` |
| POST | `/auth/forgot-password` | None | `{ email }` | 204 |
| POST | `/auth/verify-otp` | None | `{ email, otp }` | 204 |
| POST | `/auth/reset-password` | None | `{ email, otp, newPassword }` | 204 |

---

### Transactions

| Method | Endpoint | Auth | Query Params | Request Body | Response |
|--------|---------|------|-------------|-------------|----------|
| GET | `/transactions` | Yes | `month` (YYYY-MM), `category`, `type`, `search` | — | `Transaction[]` |
| POST | `/transactions` | Yes | — | `CreateTransactionRequest` | `Transaction` (201) |
| PUT | `/transactions/{id}` | Yes | — | `UpdateTransactionRequest` (partial) | `Transaction` |
| DELETE | `/transactions/{id}` | Yes | — | — | 204 |

---

### Budget

| Method | Endpoint | Auth | Query Params | Request Body | Response |
|--------|---------|------|-------------|-------------|----------|
| GET | `/budget` | Yes | `month` (YYYY-MM, required) | — | `BudgetCategory[]` |
| PUT | `/budget/{id}` | Yes | — | `{ limit, month }` | `BudgetCategory` |

> **Note:** GET `/budget` auto-creates all 12 default categories for the month if they don't exist.

**Default budget categories:** Housing, Food & Dining, Transport, Shopping, Health, Entertainment, Education, Personal Care, Utilities, Insurance, Investments, Others

---

### Net Worth

| Method | Endpoint | Auth | Request Body | Response |
|--------|---------|------|-------------|----------|
| GET | `/networth` | Yes | — | `NetWorthSnapshot` |
| POST | `/networth/items` | Yes | `{ name, value, category, type }` | `NetWorthItem` (201) |
| PUT | `/networth/items/{id}` | Yes | `{ name, value, category, type }` | `NetWorthItem` |
| DELETE | `/networth/items/{id}` | Yes | — | 204 |

---

### Calculators

All calculator endpoints are **unauthenticated** (no JWT required) and use POST.

| Endpoint | Request Body | Response |
|---------|-------------|----------|
| `POST /calculators/sip` | `{ monthlyInvestment, annualReturnRate, tenureYears }` | `{ totalInvested, estimatedReturns, maturityValue }` |
| `POST /calculators/emi` | `{ principalAmount, annualInterestRate, tenureMonths }` | `{ emi, totalAmount, totalInterest, amortizationSchedule[] }` |
| `POST /calculators/retirement` | `{ currentAge, retirementAge, monthlyExpenses, currentSavings, expectedReturnRate, inflationRate }` | `{ corpusRequired, monthlySavingsNeeded, projectedCorpus, yearsToRetirement }` |
| `POST /calculators/ctc-inhand` | `{ ctcAnnual, pfContribution, professionalTax, otherDeductions }` | `{ grossMonthly, deductions, netMonthly, annualTakeHome, breakdown[] }` |
| `POST /calculators/tax-regime` | `{ annualIncome, hraReceived, rentPaid, section80c, section80d, otherDeductions }` | `{ oldRegimeTax, newRegimeTax, recommendation, savings, oldRegimeBreakdown[], newRegimeBreakdown[] }` |

> **Note:** The remaining 7 calculators (FIRE, Dream House, Dream Vehicle, Trip Budget, Rental Yield, Lumpsum vs SIP, Debt Payoff) are currently frontend-only (JS calculations). Backend endpoints are planned for v2.

---

### Health

| Method | Endpoint | Auth | Response |
|--------|---------|------|----------|
| GET | `/health` | None | `{ "status": "ok" }` |

---

## 11. Data Models

### User

**Table:** `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, auto-generated |
| `name` | String | Default `""` |
| `email` | String | Unique, not null |
| `phone` | String | Default `""` |
| `password_hash` | String | bcrypt hash, never stored plaintext |
| `created_at` | DateTime | Server default: now() |

---

### Transaction

**Table:** `transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users (CASCADE delete) |
| `merchant` | String | Default `""` |
| `category` | String | Default `""` — free text, matches categories |
| `amount` | Numeric(14,2) | Always positive; `type` determines sign in UI |
| `type` | String | `"income"` or `"expense"` |
| `date` | Date | Transaction date |
| `account` | String | Default `""` (bank account name) |
| `note` | String | Nullable, optional memo |
| `created_at` | DateTime | Server default: now() |

---

### Budget Category

**Table:** `budget_categories`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users (CASCADE delete) |
| `name` | String | Category name (e.g. "Food & Dining") |
| `month` | String | Format: `"YYYY-MM"` |
| `limit_amount` | Numeric(14,2) | User-set monthly budget limit |
| `created_at` | DateTime | Server default: now() |

> `spent` is **computed at query time** by summing expense transactions for that category and month — it is NOT stored in the database.

---

### Net Worth Item

**Table:** `networth_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users (CASCADE delete) |
| `name` | String | e.g. "SBI Savings Account" |
| `value` | Numeric(14,2) | Current value in ₹ |
| `category` | String | Asset: `savings\|investment\|property\|gold\|epf`; Liability: `home-loan\|car-loan\|credit-card\|other` |
| `type` | String | `"asset"` or `"liability"` |
| `created_at` | DateTime | Server default: now() |
| `updated_at` | DateTime | Auto-updated on change |

---

### Frontend Type Reference

```typescript
// src/api/networth.ts
type AssetCategory = 'savings' | 'investment' | 'property' | 'gold' | 'epf';
type LiabilityCategory = 'home-loan' | 'car-loan' | 'credit-card' | 'other';
type ItemType = 'asset' | 'liability';

// src/constants/categories.ts
type TransactionCategory = 'food' | 'transport' | 'shopping' | 'utilities' |
  'entertainment' | 'health' | 'education' | 'emi' | 'income' | 'other';

// src/constants/goalTypes.ts  
type GoalType = 'house' | 'vehicle' | 'travel' | 'education' |
  'emergency-fund' | 'retirement' | 'custom';
```

---

## 12. Coding Conventions

### Naming

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `TransactionRow`, `AddGoalModal` |
| TypeScript files | PascalCase for components, camelCase for others | `LoginPage.tsx`, `client.ts` |
| CSS classes | Tailwind utility classes only | `className="text-sm font-medium text-[#28251d]"` |
| Hooks | camelCase prefixed with `use` | `useTransactions`, `useTopBarActions` |
| API service files | camelCase, one per domain | `transactions.ts`, `budget.ts` |
| Constants | SCREAMING_SNAKE_CASE for arrays/objects | `DEFAULT_CATEGORIES`, `GOAL_TYPES` |

---

### Currency Formatting

**Always** use the `formatINR` helper or `CurrencyDisplay` component for any ₹ amount shown to the user. Never format currency manually.

```typescript
// The standard formatINR function (defined in each page that needs it):
function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000)    return `₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000)       return `₹${(abs / 1_000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

// Usage examples:
formatINR(1500000)   // "₹15.00L"
formatINR(25000000)  // "₹2.50Cr"
formatINR(50000)     // "₹50.0K"
```

> All crore/lakh values use Indian numeric grouping. Never display raw numbers like `1500000`.

---

### API Service Pattern

```
Page component / Hook
  └── calls src/api/{domain}.ts function
        └── calls axiosClient from src/api/client.ts
              └── Axios interceptor adds JWT
```

```typescript
// src/api/transactions.ts — typical pattern
export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const { data } = await client.get('/transactions', { params: filters });
  return data;
}
```

---

### Mock Data Pattern

All pages currently run on mock data. The convention for marking API TODOs:

```typescript
// TODO: replace mock with API call
// import * as transactionsApi from '../../api/transactions';

const MOCK_TRANSACTIONS = [...];  // remove when wiring up
```

When wiring up a page to the real API:
1. Remove the `MOCK_*` constant
2. Uncomment the API import
3. Call the API function in a `useEffect` (or use the corresponding hook in `src/hooks/`)
4. Handle loading and error states

---

### Component Co-location

- **Shared UI primitives** → `src/components/ui/`
- **Feature components used in only one page** → defined in the same file as the page (not extracted)
- **Feature components used in 2+ pages** → extract to `src/components/` with a descriptive subfolder

---

### Color Palette

The app uses a custom color palette via Tailwind arbitrary values. Use these exact hex values — do not substitute:

| Token | Hex | Use |
|-------|-----|-----|
| Primary text | `#28251d` | All headings and body text |
| Secondary text | `#7a7974` | Labels, captions, placeholders |
| Border | `#e9e7e1` | Card borders, dividers |
| Background | `#f7f6f2` | Page background, subtle fills |
| Teal primary | `#01696f` | Primary action color |
| Teal dark | `#0c4e54` | Hover state for teal |
| Green | `#437a22` | Positive / income / on-track |
| Amber | `#b45309` | Warning / at-risk |
| Pink | `#a12c7b` | Negative / expense / liability |
| Cyan | `#0e7490` | Secondary charts / investment type |

---

### Tailwind Class Ordering

Follow the standard Tailwind ordering: layout → sizing → spacing → typography → color → border → effects.

---

## 13. Known Issues & TODO List

### Active TODOs

| # | Area | Issue | Priority |
|---|------|-------|---------|
| 1 | All pages | Mock data not wired to API — all pages use local state with `MOCK_*` constants | High |
| 2 | Calculators | 7 of 12 calculators have no backend endpoint (FIRE, Dream House, Dream Vehicle, Trip Budget, Rental Yield, Lumpsum vs SIP, Debt Payoff) | Medium |
| 3 | Goals | "Add to Goals" from Trip Budget Planner does not pre-fill the AddGoalModal | Low |
| 4 | Auth | `isAuthenticated` defaults to `true` in AuthContext — no real session persistence yet | High |
| 5 | Net Worth | `investmentSubcategory` field exists on frontend `NetWorthItem` type but not in the DB schema | Medium |
| 6 | Budget | Budget GET auto-creates categories but `spent` computation uses transactions — integration test needed | Medium |
| 7 | AA Integration | RBI Account Aggregator bank sync pending FIU (Financial Information User) registration approval | Blocked |
| 8 | WhatsApp Alerts | CallMeBot integration planned for v2 | Not started |

### Recently Fixed

- Dashboard quick actions (Add Transaction, Set Budget, Update Net Worth) — modals fully wired to local state with toast confirmations
- FIRE Calculator — rebuilt with new inputs (annual income, salary growth, FIRE goal age) and salary-growth-aware corpus simulation
- Net Worth page — investment subcategories, income benchmark, future projection chart
- Bottom tab bar — replaced Settings tab with Calculators

---

## 14. Roadmap

### MVP (Current Sprint)

- [x] 17 screens designed and built
- [x] 12 calculators (JS-only)
- [x] Goals module with goal types and detail view
- [x] Net Worth tracker with future projection
- [x] Backend API (auth, transactions, budget, net worth, 5 calculators)
- [ ] Wire frontend pages to real API
- [ ] Real auth session persistence
- [ ] End-to-end testing

### v2

- WhatsApp budget alerts via CallMeBot API
- RBI Account Aggregator bank transaction sync (pending FIU approval)
- Backend endpoints for remaining 7 calculators
- Push notifications
- Dark mode

### v3

- AI-powered spending insights (LLM analysis of transaction patterns)
- Premium tier (advanced reports, unlimited history)
- React Native mobile app
- Export to PDF/Excel
- Multi-user household support

---

## 15. Contact & Resources

| Resource | Detail |
|----------|--------|
| Project owner | [Your Name] — [email] |
| GitHub repository | [GitHub URL] |
| Project board (OpenProject) | [OpenProject URL] |
| Design reference (Figma) | [Figma URL] |
| API docs (local) | `http://localhost:8000/docs` (Swagger UI when backend is running) |
| Backend health check | `http://localhost:8000/health` |

---

## Quick Reference Card

```bash
# Start frontend
npm run dev                           # http://localhost:5173

# Start backend
cd backend && uvicorn main:app --reload   # http://localhost:8000

# Run migrations
cd backend && alembic upgrade head

# API docs
open http://localhost:8000/docs

# Build frontend for production
npm run build

# Type-check frontend
npm run typecheck
```

```
Key file locations:
  Routes          → src/App.tsx
  API client      → src/api/client.ts
  Auth state      → src/contexts/AuthContext.tsx
  UI components   → src/components/ui/index.ts
  Color palette   → See §12 (hardcoded Tailwind hex values)
  Calculator hub  → src/pages/app/CalculatorsPage.tsx
  DB models       → backend/models/
  API endpoints   → backend/routers/
```

---

*This document covers Finley as of June 2026. Update this file whenever new screens, API endpoints, or architectural decisions are added.*
