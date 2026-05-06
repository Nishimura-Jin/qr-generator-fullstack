import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    qr_type = Column(String, nullable=False, default="url")
    content = Column(Text, nullable=False)
    label_text = Column(String)
    label_position = Column(String)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    Base.metadata.create_all(bind=engine)


def create_user(username: str, hashed_password: str):
    with SessionLocal() as db:
        user = User(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()


def get_user_by_username(username: str):
    with SessionLocal() as db:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        return {
            "id": user.id,
            "username": user.username,
            "hashed_password": user.hashed_password,
        }


def delete_user(user_id: int):
    with SessionLocal() as db:
        db.query(User).filter(User.id == user_id).delete()
        db.commit()


def save_history(
    user_id: int,
    qr_type: str,
    content: str,
    label_text: str,
    label_position: str,
    expires_at: str | None,
):
    with SessionLocal() as db:
        expires = None
        if expires_at:
            try:
                expires = datetime.fromisoformat(expires_at)
            except ValueError:
                expires = None
        history = History(
            user_id=user_id,
            qr_type=qr_type,
            content=content,
            label_text=label_text,
            label_position=label_position,
            expires_at=expires,
        )
        db.add(history)
        db.commit()


def get_history(user_id: int):
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        rows = (
            db.query(History)
            .filter(
                History.user_id == user_id,
                (History.expires_at == None) | (History.expires_at > now),
            )
            .order_by(History.created_at.desc())
            .limit(50)
            .all()
        )
        return [
            {
                "id": r.id,
                "qr_type": r.qr_type,
                "content": r.content,
                "label_text": r.label_text,
                "label_position": r.label_position,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]


def delete_history(history_id: int, user_id: int):
    with SessionLocal() as db:
        db.query(History).filter(
            History.id == history_id, History.user_id == user_id
        ).delete()
        db.commit()


def delete_all_history(user_id: int):
    with SessionLocal() as db:
        db.query(History).filter(History.user_id == user_id).delete()
        db.commit()
