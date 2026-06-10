from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import random
import string

from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import User, PasswordResetOtp

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def get_current_user(token: str, db: Session) -> User:
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def register_user(db: Session, name: str, email: str, phone: str, password: str) -> tuple[User, str]:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(name=name, email=email, phone=phone, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return user, token


def login_user(db: Session, email: str, password: str) -> tuple[User, str]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return user, token


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_otp(db: Session, email: str) -> str:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Return silently — don't reveal whether email exists
        return ""
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    record = PasswordResetOtp(email=email, otp=otp, expires_at=expires)
    db.add(record)
    db.commit()
    return otp


def verify_otp(db: Session, email: str, otp: str) -> bool:
    now = datetime.now(timezone.utc)
    record = (
        db.query(PasswordResetOtp)
        .filter(
            PasswordResetOtp.email == email,
            PasswordResetOtp.otp == otp,
            PasswordResetOtp.used == False,  # noqa: E712
            PasswordResetOtp.expires_at > now,
        )
        .first()
    )
    return record is not None


def reset_password(db: Session, email: str, otp: str, new_password: str) -> None:
    now = datetime.now(timezone.utc)
    record = (
        db.query(PasswordResetOtp)
        .filter(
            PasswordResetOtp.email == email,
            PasswordResetOtp.otp == otp,
            PasswordResetOtp.used == False,  # noqa: E712
            PasswordResetOtp.expires_at > now,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.password_hash = hash_password(new_password)
    record.used = True
    db.commit()
