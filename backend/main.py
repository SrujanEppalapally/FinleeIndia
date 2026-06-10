from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, transactions, budget, networth, calculators

app = FastAPI(title="Personal Finance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budget.router)
app.include_router(networth.router)
app.include_router(calculators.router)


@app.get("/health")
def health():
    return {"status": "ok"}
