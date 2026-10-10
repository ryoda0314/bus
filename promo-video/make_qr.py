"""Web 版の動画（BusPromoWeb）のエンドカードに出す QR コードを作る → public/web/qr.png

    python make_qr.py

URL は src/theme.js の WEB_URL から読む（置き場所を1か所にするため）。
1モジュール = 1px の白黒画像にして、動画の側で拡大して描く（image-rendering: pixelated）。
"""
import os
import re
import sys

import qrcode

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
theme = open(os.path.join(HERE, "src", "theme.js"), encoding="utf-8").read()
url = re.search(r"export const WEB_URL = '([^']+)'", theme).group(1)

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=0)
qr.add_data(url)
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
out = os.path.join(HERE, "public", "web", "qr.png")
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out)
print(f"wrote public/web/qr.png（{url}、{img.size[0]}x{img.size[1]} モジュール）")
