import os
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

template_path = r"C:/Users/PARTH/.gemini/antigravity/brain/61eae5b4-e10a-4deb-aa00-7a553479320e/.user_uploaded/media_1790787021176.pptx"
output_path = r"c:/Users/PARTH/OneDrive/Documents/hackethon/Hack 2 ignite/CareerPath AI/CareerPath_AI_HACK2IGNITE_Submission.pptx"

if not os.path.exists(template_path):
    print("Template not found at", template_path)
    exit(1)

prs = pptx.Presentation(template_path)
print("Loaded presentation with", len(prs.slides), "slides")

# Check shapes on each slide
for idx, slide in enumerate(prs.slides):
    print(f"\n--- Slide {idx+1} ---")
    for s_idx, shape in enumerate(slide.shapes):
        if shape.has_text_frame:
            text = shape.text_frame.text.strip().replace('\n', ' ')
            print(f"Shape {s_idx}: {text[:60]}")

print("Done inspection")
