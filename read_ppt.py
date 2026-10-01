import zipfile, re, sys

sys.stdout.reconfigure(encoding='utf-8')

path = r'C:/Users/PARTH/.gemini/antigravity/brain/61eae5b4-e10a-4deb-aa00-7a553479320e/.user_uploaded/media_1790786257634.pptx'
outpath = r'C:/Users/PARTH/OneDrive/Documents/hackethon/Hack 2 ignite/CareerPath AI/ppt_slides.txt'

with zipfile.ZipFile(path) as z:
    slides = sorted([f for f in z.namelist() if 'ppt/slides/slide' in f and 'rels' not in f])
    
    lines = []
    lines.append(f"Total slides: {len(slides)}\n")
    
    for i, s in enumerate(slides):
        xml = z.read(s).decode('utf-8', errors='ignore')
        texts = re.findall(r'<a:t>(.*?)</a:t>', xml)
        texts = [t.strip() for t in texts if t.strip()]
        lines.append(f"=== SLIDE {i+1} ===")
        for t in texts:
            lines.append(f"  {t}")
        lines.append("")
    
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print("Done! File saved.")
