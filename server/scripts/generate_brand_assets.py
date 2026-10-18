import os
import io
import base64
import PIL.Image

def main():
    src_path = r"C:\Users\PARTH\.gemini\antigravity\brain\5477b5ac-dde8-43f8-b1a3-44056dddb975\.user_uploaded\media_1792346462134_2d7eded1.png"
    assert os.path.exists(src_path), f"Source not found: {src_path}"

    master = PIL.Image.open(src_path)

    # 1. Save logo-original.png
    os.makedirs("client/assets", exist_ok=True)
    os.makedirs("admin-client/assets", exist_ok=True)
    master.save("client/assets/logo-original.png", format="PNG")
    print("Saved client/assets/logo-original.png")

    # 2. Compute tight balanced crop with ~74% mark fill (optical perfection for squircle and icons)
    bbox = master.getbbox()
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    max_dim = max(w, h)
    box_size = int(max_dim / 0.74)
    left = int(cx - box_size / 2)
    top = int(cy - box_size / 2)
    crop_master = master.crop((left, top, left + box_size, top + box_size))

    # 3. Generate raster sizes
    img_1024 = crop_master.resize((1024, 1024), PIL.Image.Resampling.LANCZOS)
    img_640  = crop_master.resize((640, 640), PIL.Image.Resampling.LANCZOS)
    img_512  = crop_master.resize((512, 512), PIL.Image.Resampling.LANCZOS)
    img_256  = crop_master.resize((256, 256), PIL.Image.Resampling.LANCZOS)
    img_64   = crop_master.resize((64, 64), PIL.Image.Resampling.LANCZOS)
    img_48   = crop_master.resize((48, 48), PIL.Image.Resampling.LANCZOS)
    img_32   = crop_master.resize((32, 32), PIL.Image.Resampling.LANCZOS)
    img_16   = crop_master.resize((16, 16), PIL.Image.Resampling.LANCZOS)

    img_512.save("client/assets/logo.png", format="PNG")
    img_512.save("client/assets/logo-512.png", format="PNG")
    img_256.save("client/assets/logo-256.png", format="PNG")
    img_640.save("client/assets/logo-square.png", format="PNG")
    img_64.save("client/assets/favicon-64.png", format="PNG")
    img_32.save("client/assets/favicon-32.png", format="PNG")
    img_512.save("admin-client/assets/logo.png", format="PNG")
    print("Saved all raster PNGs")

    # 4. Generate multi-resolution client/favicon.ico
    img_256.save(
        "client/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print("Saved client/favicon.ico")

    # 5. Base64 strings for SVGs
    def to_b64(img):
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        return base64.b64encode(buf.getvalue()).decode("ascii")

    b64_512 = to_b64(img_512)
    b64_256 = to_b64(img_256)
    b64_128 = to_b64(crop_master.resize((128, 128), PIL.Image.Resampling.LANCZOS))

    # 6. Generate client/assets/logo.svg and admin-client/assets/logo.svg
    logo_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="disheeraSquircle">
      <rect x="3" y="3" width="194" height="194" rx="44" />
    </clipPath>
    <linearGradient id="badgeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" stop-opacity="0.75" />
      <stop offset="50%" stop-color="#2563EB" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.65" />
    </linearGradient>
  </defs>

  <g clip-path="url(#disheeraSquircle)">
    <rect x="3" y="3" width="194" height="194" fill="#FFFFFF" />
    <image href="data:image/png;base64,{b64_512}" x="3" y="3" width="194" height="194" preserveAspectRatio="xMidYMid meet" />
  </g>
  <rect x="3" y="3" width="194" height="194" rx="44" fill="none" stroke="url(#badgeBorder)" stroke-width="2.5" />
</svg>
"""

    with open("client/assets/logo.svg", "w", encoding="utf-8") as f:
        f.write(logo_svg)
    with open("admin-client/assets/logo.svg", "w", encoding="utf-8") as f:
        f.write(logo_svg)
    print("Saved client/assets/logo.svg and admin-client/assets/logo.svg")

    # 7. Generate client/assets/logo-full.svg
    logo_full_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 100" width="100%" height="100%">
  <defs>
    <clipPath id="fullEmblemSquircle">
      <rect x="10" y="10" width="80" height="80" rx="18" />
    </clipPath>
    <linearGradient id="fullBadgeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.65" />
    </linearGradient>
  </defs>

  <!-- Left: Official Logo Mark (80x80) -->
  <g clip-path="url(#fullEmblemSquircle)">
    <rect x="10" y="10" width="80" height="80" fill="#FFFFFF" />
    <image href="data:image/png;base64,{b64_256}" x="10" y="10" width="80" height="80" preserveAspectRatio="xMidYMid meet" />
  </g>
  <rect x="10" y="10" width="80" height="80" rx="18" fill="none" stroke="url(#fullBadgeBorder)" stroke-width="2" />

  <!-- Right: Wordmark Typography -->
  <g transform="translate(108, 0)">
    <text x="0" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="42" font-weight="800" fill="#0F172A" letter-spacing="-1">
      Dishe<tspan fill="#2563EB">era</tspan>
    </text>
    <text x="2" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="12" font-weight="600" fill="#64748B" letter-spacing="2.5">
      AUTONOMOUS CAREER GPS &amp; TALENT OS
    </text>
  </g>
</svg>
"""

    with open("client/assets/logo-full.svg", "w", encoding="utf-8") as f:
        f.write(logo_full_svg)
    print("Saved client/assets/logo-full.svg")

    # 8. Generate client/favicon.svg
    favicon_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <clipPath id="favSquircle">
      <rect x="1" y="1" width="62" height="62" rx="14" />
    </clipPath>
  </defs>
  <g clip-path="url(#favSquircle)">
    <rect x="1" y="1" width="62" height="62" fill="#FFFFFF" />
    <image href="data:image/png;base64,{b64_128}" x="1" y="1" width="62" height="62" preserveAspectRatio="xMidYMid meet" />
  </g>
  <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-opacity="0.5" />
</svg>
"""

    with open("client/favicon.svg", "w", encoding="utf-8") as f:
        f.write(favicon_svg)
    print("Saved client/favicon.svg")

if __name__ == "__main__":
    main()
