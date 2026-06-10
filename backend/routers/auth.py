from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    LoginRequest, RegisterRequest, ForgotPasswordRequest,
    VerifyOtpRequest, ResetPasswordRequest, AuthResponse, UserOut,
)
import services.auth_service as svc

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user, token = svc.register_user(db, body.name, str(body.email), body.phone, body.password)
    return AuthResponse(token=token, user=UserOut(id=str(user.id), name=user.name, email=user.email, phone=user.phone))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user, token = svc.login_user(db, str(body.email), body.password)
    return AuthResponse(token=token, user=UserOut(id=str(user.id), name=user.name, email=user.email, phone=user.phone))


@router.post("/forgot-password", status_code=204)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # OTP is generated and stored; in production send via email/SMS
    svc.create_otp(db, str(body.email))


@router.post("/verify-otp", status_code=204)
def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    valid = svc.verify_otp(db, str(body.email), body.otp)
    if not valid:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")


@router.post("/reset-password", status_code=204)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    svc.reset_password(db, str(body.email), body.otp, body.newPassword)
