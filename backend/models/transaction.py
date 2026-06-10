from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    merchant = Column(String, nullable=False, default="")
    category = Column(String, nullable=False, default="")
    amount = Column(Numeric(14, 2), nullable=False, default=0)
    type = Column(String, nullable=False, default="expense")
    date = Column(Date, nullable=False)
    account = Column(String, nullable=False, default="")
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
