from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# 同じフォルダ内のファイルをインポート
from .database import delete_history, get_history, init_db, save_history
from .qr_service import generate_qr_code

app = FastAPI()

# 開発中はすべてのオリジンからの通信を許可する設定に変更
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# アプリ起動時にDBを初期化する
@app.on_event("startup")
async def startup():
    init_db()

# リクエストのデータ型を定義
class QRRequest(BaseModel):
    url: str
    label_text: str = ""
    label_position: str = "Top"

# ---- エンドポイント ----

@app.get("/")
def read_root():
    return {"status": "FastAPI is running!"}

@app.post("/api/qr")
async def create_qr(body: QRRequest):
    if not body.url:
        raise HTTPException(status_code=400, detail="URLが空です")

    # QR生成
    qr_bytes = generate_qr_code(body.url, body.label_text, body.label_position)
    # DB保存
    save_history(body.url, body.label_text, body.label_position)

    return Response(content=qr_bytes, media_type="image/png")

@app.get("/api/history")
async def list_history():
    return get_history()

@app.delete("/api/history/{history_id}")
async def remove_history(history_id: int):
    delete_history(history_id)
    return {"ok": True}