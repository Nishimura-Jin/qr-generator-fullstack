import os
import sqlite3
from datetime import datetime
from io import BytesIO
from urllib.parse import urlparse

import qrcode
import streamlit as st
from PIL import Image, ImageDraw, ImageFont

# app.pyと同じフォルダにhistory.dbを作成する
DB_PATH = os.path.join(os.path.dirname(__file__), "history.db")


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


def save_history(url, label_text, label_position):
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
    return rows


def delete_history(history_id):
    # 指定したIDの履歴をDBから削除する
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM history WHERE id = ?", (history_id,))
    conn.commit()
    conn.close()


def generate_qr_code(url, label_text=None, label_position="Top"):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # 注釈がない場合はQR画像のみを返す
    if not label_text:
        buf = BytesIO()
        qr_img.save(buf, format="PNG")
        return buf.getvalue()

    width, height = qr_img.size
    margin = 60
    font_size = 24

    current_dir = os.path.dirname(__file__)
    font_path = os.path.join(current_dir, "fonts", "NotoSansJP-Medium.ttf")

    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        # フォント読み込み失敗時の保険（エラーを表示して標準フォントを使用）
        st.error(f"Font Load Error: {e}")
        font = ImageFont.load_default()

    new_height = height + margin
    combined_img = Image.new("RGB", (width, new_height), "white")
    draw = ImageDraw.Draw(combined_img)

    # テキストを中央寄せにするための計算
    text_bbox = draw.textbbox((0, 0), label_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x_pos = (width - text_width) // 2

    if label_position == "Top":
        # 上に文字、下にQR
        draw.text(
            (x_pos, (margin - font_size) // 2), label_text, fill="black", font=font
        )
        combined_img.paste(qr_img, (0, margin))
    else:
        # 上にQR、下に文字
        combined_img.paste(qr_img, (0, 0))
        draw.text(
            (x_pos, height + (margin - font_size) // 2),
            label_text,
            fill="black",
            font=font,
        )

    buf = BytesIO()
    combined_img.save(buf, format="PNG")
    return buf.getvalue()


def main():
    init_db()

    st.set_page_config(page_title="QRコード生成アプリ", layout="wide")
    st.title("URL to QR Generator")
    st.write("URLを入力してQRコードを生成できます。日本語の注釈も追加可能です。")

    with st.sidebar:
        st.header("生成履歴")
        history = get_history()
        if history:
            for row in history:
                _, h_url, h_label, h_position, h_created_at = row
                label = h_label if h_label else "注釈なし"
                col1, col2 = st.columns([4, 1])
                with col1:
                    if st.button(f"{h_url[:30]}　{label}", key=f"history_{row[0]}"):
                        st.session_state["url"] = h_url
                        st.session_state["label_text"] = h_label or ""
                        st.session_state["label_position"] = h_position
                        st.session_state["qr_bytes"] = None
                        st.rerun()
                with col2:
                    if st.button("🗑", key=f"delete_{row[0]}"):
                        delete_history(row[0])
                        st.rerun()
        else:
            st.write("まだ履歴がありません")

    url = st.text_input(
        "QRコードにするURLを入力:",
        placeholder="https://example.com",
        value=st.session_state.get("url", ""),
    )

    with st.expander("注釈（ラベル）の設定"):
        label_text = st.text_input(
            "表示する文字を入力してください",
            placeholder="例：公式LINEはこちら",
            value=st.session_state.get("label_text", ""),
        )
        position_options = ["Top", "Bottom"]
        default_position = st.session_state.get("label_position", "Top")
        label_position = st.radio(
            "文字の配置を選択",
            position_options,
            index=position_options.index(default_position),
            horizontal=True,
        )

    if st.button("QRコードを生成"):
        if url:
            with st.spinner("生成中..."):
                qr_bytes = generate_qr_code(url, label_text, label_position)
                save_history(url, label_text, label_position)
                # 生成したQRコードをsession_stateに保存しておく
                st.session_state["qr_bytes"] = qr_bytes
                st.session_state["qr_url"] = url
            st.rerun()
        else:
            st.warning("URLが空欄です。入力をお願いします。")

    # session_stateにQRコードがある場合は表示する
    if st.session_state.get("qr_bytes"):
        st.image(
            st.session_state["qr_bytes"], caption="生成結果（プレビュー）", width=300
        )
        st.link_button(
            "生成したリンクをブラウザで開いて確認する", st.session_state["qr_url"]
        )
        domain = urlparse(st.session_state["qr_url"]).netloc or "qr_code"
        date_str = datetime.now().strftime("%Y%m%d")
        st.download_button(
            label="画像を保存する",
            data=st.session_state["qr_bytes"],
            file_name=f"qr_{domain}_{date_str}.png",
            mime="image/png",
        )


if __name__ == "__main__":
    main()
