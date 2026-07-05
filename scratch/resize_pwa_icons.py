import os
from PIL import Image
import shutil

src_img = r"C:\Users\ndens\antigravity-ide\brain\48c27ce3-ecb8-4e73-a310-8e39c12ab51b\pwa_icon_512_1782991761804.png"
if not os.path.exists(src_img):
    src_img = r"C:\Users\ndens\.gemini\antigravity-ide\brain\48c27ce3-ecb8-4e73-a310-8e39c12ab51b\pwa_icon_512_1782991761804.png"

public_dir = r"c:\Users\ndens\mavi-core\public"
dest_512 = os.path.join(public_dir, "pwa-512x512.png")
dest_192 = os.path.join(public_dir, "pwa-192x192.png")

if not os.path.exists(src_img):
    print(f"Error: Source image not found at {src_img}")
    exit(1)

os.makedirs(public_dir, exist_ok=True)

print(f"Copying {src_img} to {dest_512}")
shutil.copy(src_img, dest_512)

print(f"Resizing to 192x192 and saving to {dest_192}")
with Image.open(src_img) as img:
    resized_img = img.resize((192, 192), Image.Resampling.LANCZOS)
    resized_img.save(dest_192, "PNG")

print("Done! Both icons copied and resized successfully.")
