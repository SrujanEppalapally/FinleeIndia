from fastapi import APIRouter, Response, status
from sqlalchemy import text

from config import get_settings
from database import SessionLocal

router = APIRouter()


def _health_payload(db_ok: bool) -> dict:
    s = get_settings()
    base = {"service": "finlee-api", "environment": s.app_env}
    if db_ok:
        return {"status": "ok", "database": "connected", **base}
    return {"status": "error", "database": "unavailable", **base}


def _check_db() -> bool:
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception:
        return False


@router.get("/health")
def health(response: Response):
    db_ok = _check_db()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return _health_payload(db_ok)


@router.get("/api/v1/health")
def health_v1(response: Response):
    db_ok = _check_db()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return _health_payload(db_ok)
