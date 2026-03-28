import os
from io import BytesIO
import qrcode
from PIL import Image, ImageDraw, ImageFont

def generate_qr_code(url: str, label_text: str = None, label_position: str = "Top") -> bytes:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    if not label_text:
        buf = BytesIO()
        qr_img.save(buf, format="PNG")
        return buf.getvalue()

    width, height = qr_img.size
    margin = 60
    font_size = 24

    # Dockerコンテナ内での絶対パスを指定
    # /app/src/fonts/NotoSansJP-Medium.ttf を探しに行きます
    current_dir = os.path.dirname(__file__)
    font_path = os.path.join(current_dir, "fonts", "NotoSansJP-Medium.ttf")

    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        # 失敗した場合はエラー内容をプリントし（Dockerログで見れます）、標準フォントへ
        print(f"Font Load Error: {e}")
        font = ImageFont.load_default()

    new_height = height + margin
    combined_img = Image.new("RGB", (width, new_height), "white")
    draw = ImageDraw.Draw(combined_img)

    text_bbox = draw.textbbox((0, 0), label_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x_pos = (width - text_width) // 2

    if label_position == "Top":
        draw.text((x_pos, (margin - font_size) // 2), label_text, fill="black", font=font)
        combined_img.paste(qr_img, (0, margin))
    else:
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