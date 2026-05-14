import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .auth import create_access_token, decode_token, hash_password, verify_password
from .database import (
    create_user,
    delete_all_history,
    delete_history,
    delete_user,
    get_history,
    get_user_by_username,
    init_db,
    save_history,
)
from .qr_service import generate_qr_code

logging.basicConfig(level=logging.INFO)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://qr-generator-fullstack.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= 認証ヘルパー =================
def get_current_user_optional(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    payload = decode_token(token)
    return payload if payload else None


def get_current_user(authorization: Optional[str] = Header(default=None)):
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="認証が必要です")
    return user


# ================= スキーマ =================
class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class QRRequest(BaseModel):
    qr_type: str = "url"
    content: str
    label_text: str = ""
    label_position: str = "Top"
    expires_at: Optional[str] = None


# ================= ルート =================
@app.get("/")
def read_root():
    return {"status": "ok"}


# ---- ユーザー管理 ----
@app.post("/api/register")
def register(body: RegisterRequest):
    if get_user_by_username(body.username):
        raise HTTPException(
            status_code=400, detail="このユーザー名は既に使われています"
        )
    create_user(body.username, hash_password(body.password))
    return {"ok": True}


@app.post("/api/login")
def login(body: LoginRequest):
    user = get_user_by_username(body.username)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401, detail="ユーザー名またはパスワードが違います"
        )
    token = create_access_token(user["id"], user["username"])
    return {"access_token": token, "username": user["username"]}


@app.delete("/api/user")
def remove_user(current_user: dict = Depends(get_current_user)):
    delete_user(current_user["user_id"])
    return {"ok": True}


# ---- QRコード生成（ゲスト・ログイン両対応） ----
@app.post("/api/qr")
@limiter.limit("10/minute", exempt_when=lambda request: _is_authenticated(request))
async def create_qr(
    request: Request,
    body: QRRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    try:
        qr_bytes = generate_qr_code(
            body.qr_type,
            body.content,
            body.label_text,
            body.label_position,
        )
        if current_user:
            save_history(
                user_id=current_user["user_id"],
                qr_type=body.qr_type,
                content=body.content,
                label_text=body.label_text,
                label_position=body.label_position,
                expires_at=body.expires_at,
            )
        return Response(content=qr_bytes, media_type="image/png")
    except Exception as e:
        logging.error(f"QR生成エラー: {e}")
        raise HTTPException(status_code=500, detail="QRコードの生成に失敗しました")


def _is_authenticated(request: Request) -> bool:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return False
    token = auth.removeprefix("Bearer ")
    return bool(decode_token(token))


# ---- 履歴管理（ログイン必須） ----
@app.get("/api/history")
def list_history(current_user: dict = Depends(get_current_user)):
    return get_history(current_user["user_id"])


@app.delete("/api/history")
def remove_all_history(current_user: dict = Depends(get_current_user)):
    delete_all_history(current_user["user_id"])
    return {"ok": True}


@app.delete("/api/history/{history_id}")
def remove_history(
    history_id: int,
    current_user: dict = Depends(get_current_user),
):
    delete_history(history_id, current_user["user_id"])
    return {"ok": True}
