# Personal Finance — Python FastAPI Backend

## Setup

### 1. Configure the database

Edit `backend/.env` and set `DATABASE_URL` to your Supabase PostgreSQL connection string.

Find it in: **Supabase Dashboard → Project Settings → Database → Connection string (URI)**

Replace `YOUR_DB_PASSWORD` with your actual database password:

```
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_DB_PASSWORD@db.irwcrclwzfkwvmvwaywt.supabase.co:5432/postgres
```

Also set a strong random `SECRET_KEY` for JWT signing.

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start both servers

**Terminal 1 — Frontend**
```bash
npm install && npm run dev
```

**Terminal 2 — Backend**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, returns JWT |
| POST | /auth/forgot-password | Request OTP |
| POST | /auth/verify-otp | Verify OTP |
| POST | /auth/reset-password | Reset password with OTP |
| GET | /transactions | List transactions (filters: month, category, type, search) |
| POST | /transactions | Create transaction |
| PUT | /transactions/{id} | Update transaction |
| DELETE | /transactions/{id} | Delete transaction |
| GET | /budget?month=YYYY-MM | Get budget categories with spent amounts |
| PUT | /budget/{id} | Update budget limit |
| GET | /networth | Get net worth snapshot |
| POST | /networth/items | Add asset/liability |
| PUT | /networth/items/{id} | Update item |
| DELETE | /networth/items/{id} | Delete item |
| POST | /calculators/sip | SIP calculator |
| POST | /calculators/emi | EMI calculator |
| POST | /calculators/retirement | Retirement planner |
| POST | /calculators/ctc-inhand | CTC to in-hand salary |
| POST | /calculators/tax-regime | Old vs New tax regime |
