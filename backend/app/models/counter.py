from sqlalchemy import Column, Integer, String, DateTime, func, CheckConstraint
from app.database import Base


class GlobalCounter(Base):
    __tablename__ = "global_counter"

    id = Column(Integer, primary_key=True, default=1)
    count = Column(Integer, default=0, nullable=False)
    last_updated_by = Column(String(255))
    last_updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (CheckConstraint("id = 1", name="single_row"),)
