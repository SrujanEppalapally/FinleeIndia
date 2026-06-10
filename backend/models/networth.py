from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base


class NetWorthItem(Base):
    __tablename__ = "networth_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, default="")
    value = Column(Numeric(14, 2), nullable=False, default=0)
    category = Column(String, nullable=False, default="")
    type = Column(String, nullable=False, default="asset")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
