from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserOut
