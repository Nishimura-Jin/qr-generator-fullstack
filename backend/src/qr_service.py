import logging
import os
from io import BytesIO

import qrcode
from PIL import Image, ImageDraw, ImageFont


def build_qr_content(qr_type: str, content: str) -> str:
    if qr_type == "email":
        return f"mailto:{content}"
    if qr_type == "phone":
        return f"tel:{content}"
    if qr_type == "wifi":
        # content形式: "SSID,PASSWORD,WPA"
        parts = content.split(",")
        ssid = parts[0] if len(parts) > 0 else ""
        password = parts[1] if len(parts) > 1 else ""
        security = parts[2] if len(parts) > 2 else "WPA"
        return f"WIFI:T:{security};S:{ssid};P:{password};;"
    return content


def generate_qr_code(
    qr_type: str,
    content: str,
    label_text: str = "",
    label_position: str = "Top",
) -> bytes:
    qr_content = build_qr_content(qr_type, content)
    qr = qrcode.make(qr_content).convert("RGB")

    if not label_text:
        buf = BytesIO()
        qr.save(buf, format="PNG")
        return buf.getvalue()

    width, height = qr.size
    margin = 60

    font_path = os.path.join(
        os.path.dirname(__file__),
        "fonts",
        "NotoSansJP-Medium.ttf",
    )

    try:
        font = ImageFont.truetype(font_path, 24)
    except Exception as e:
        logging.warning(f"フォントの読み込みに失敗しました: {e}")
        font = ImageFont.load_default()

    new_img = Image.new("RGB", (width, height + margin), "white")
    draw = ImageDraw.Draw(new_img)

    text_bbox = draw.textbbox((0, 0), label_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x = (width - text_width) // 2

    if label_position == "Top":
        draw.text((x, 10), label_text, fill="black", font=font)
        new_img.paste(qr, (0, margin))
    else:
        new_img.paste(qr, (0, 0))
        draw.text((x, height + 10), label_text, fill="black", font=font)

    buf = BytesIO()
    new_img.save(buf, format="PNG")
    return buf.getvalue()
