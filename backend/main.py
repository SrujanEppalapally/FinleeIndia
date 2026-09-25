from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import auth, transactions, budget, networth, calculators
from app_health import router as health_router

settings = get_settings()

app = FastAPI(title="Personal Finance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health_router)
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budget.router)
app.include_router(networth.router)
app.include_router(calculators.router)
