import os
import sqlite3

# DBの場所を /app/history.db （コンテナのルート）に固定することで、
# Dockerのボリューム機能でデータが消えないようにします。
DB_PATH = "/app/history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            label_text TEXT,
            label_position TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()

def save_history(url: str, label_text: str, label_position: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO history (url, label_text, label_position) VALUES (?, ?, ?)",
        (url, label_text, label_position),
    )
    conn.commit()
    conn.close()

def get_history():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT id, url, label_text, label_position, created_at FROM history ORDER BY created_at DESC LIMIT 20"
    ).fetchall()
    conn.close()
    return [
        {
            "id": row[0],
            "url": row[1],
            "label_text": row[2],
            "label_position": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]

def delete_history(history_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM history WHERE id = ?", (history_id,))
    conn.commit()
    conn.close()