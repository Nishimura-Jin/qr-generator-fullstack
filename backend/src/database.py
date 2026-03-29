import sqlite3

DB_PATH = "/app/history.db"

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
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

def save_history(url: str, label_text: str, label_position: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO history (url, label_text, label_position) VALUES (?, ?, ?)",
            (url, label_text, label_position),
        )

def get_history():
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT id, url, label_text, label_position, created_at FROM history ORDER BY created_at DESC LIMIT 20"
        ).fetchall()

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
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM history WHERE id = ?", (history_id,))