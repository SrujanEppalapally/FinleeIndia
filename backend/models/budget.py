from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, default="")
    month = Column(String, nullable=False, default="")
    limit_amount = Column(Numeric(14, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
