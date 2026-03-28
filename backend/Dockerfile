FROM python:3.11-slim

WORKDIR /app

# backendフォルダ内の requirements.txt をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 残りの src フォルダなどをすべてコピー
COPY . .

# src フォルダの中にある app.py を起動するように変更
CMD ["streamlit", "run", "src/app.py", "--server.port=8501", "--server.address=0.0.0.0"]