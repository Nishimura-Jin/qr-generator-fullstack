from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, HttpUrl
import logging

from .database import delete_history, get_history, init_db, save_history
from .qr_service import generate_qr_code

app = FastAPI()

logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()


class QRRequest(BaseModel):
    url: HttpUrl
    label_text: str = ""
    label_position: str = "Top"


@app.get("/")
def read_root():
    return {"status": "FastAPI is running!"}


@app.post("/api/qr")
async def create_qr(body: QRRequest):
    try:
        qr_bytes = generate_qr_code(
            str(body.url),
            body.label_text,
            body.label_position
        )

        save_history(str(body.url), body.label_text, body.label_position)

        logging.info(f"QR生成: {body.url}")

        return Response(content=qr_bytes, media_type="image/png")

    except Exception as e:
        logging.error(f"エラー: {e}")
        raise HTTPException(status_code=500, detail="QRコードの生成に失敗しました")


@app.get("/api/history")
async def list_history():
    return get_history()


@app.delete("/api/history/{history_id}")
async def remove_history(history_id: int):
    delete_history(history_id)
    return {"ok": True}