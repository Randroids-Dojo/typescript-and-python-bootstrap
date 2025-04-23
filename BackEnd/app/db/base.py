from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here so Alembic can detect them
from app.db.models.user import User  # noqa
from app.db.models.item import Item  # noqa
