import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, HttpUrl

from .database import delete_all_history, delete_history, get_history, init_db, save_history
from .qr_service import generate_qr_code

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://qr-generator-fullstack.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QRRequest(BaseModel):
    url: HttpUrl
    label_text: str = ""
    label_position: str = "Top"


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.post("/api/qr")
async def create_qr(body: QRRequest):
    try:
        qr_bytes = generate_qr_code(
            str(body.url),
            body.label_text,
            body.label_position
        )
        save_history(str(body.url), body.label_text, body.label_position)
        return Response(content=qr_bytes, media_type="image/png")

    except Exception as e:
        logging.error(f"QR生成エラー: {e}")
        raise HTTPException(status_code=500, detail="QRコードの生成に失敗しました")


@app.get("/api/history")
async def list_history():
    return get_history()


@app.delete("/api/history")
async def remove_all_history():
    delete_all_history()
    return {"ok": True}


@app.delete("/api/history/{history_id}")
async def remove_history(history_id: int):
    delete_history(history_id)
    return {"ok": True}