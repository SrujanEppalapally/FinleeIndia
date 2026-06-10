from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, default="")
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False, default="")
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
