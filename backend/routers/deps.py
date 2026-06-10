from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User
import services.auth_service as auth_svc

bearer = HTTPBearer()


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    user = auth_svc.get_current_user(token, db)
    return user
