FROM python:3.11-slim

WORKDIR /app

# requirements.txt をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# src フォルダなどをすべてコピー
COPY . .

# FastAPIサーバーを起動する
CMD ["uvicorn", "src.main_api:app", "--host", "0.0.0.0", "--port", "8000"]