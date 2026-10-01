"""
CareerPath AI — Hackathon PPT Generator
Team: 404 Brain Not Found | Hack2Ignite 2026–27
Run: pip install python-pptx Pillow && python generate_ppt.py
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt
import os

# ── Color Palette ─────────────────────────────────────────────
BG_DARK      = RGBColor(0x0D, 0x0F, 0x1A)   # Deep navy
ACCENT_CYAN  = RGBColor(0x00, 0xF2, 0xFE)   # Cyan glow
ACCENT_TEAL  = RGBColor(0x00, 0xC9, 0xA7)   # Teal
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GREY   = RGBColor(0xB0, 0xB8, 0xD0)
YELLOW       = RGBColor(0xFF, 0xD7, 0x00)
GREEN        = RGBColor(0x28, 0xA7, 0x45)
RED          = RGBColor(0xDC, 0x35, 0x45)

SCREENSHOTS_DIR = r"careerpath-ai\assets\screenshots"

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

BLANK_LAYOUT = prs.slide_layouts[6]  # blank

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def add_bg(slide, color=BG_DARK):
    from pptx.oxml.ns import qn
    from lxml import etree
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color

def txbox(slide, text, l, t, w, h, size=18, bold=False, color=WHITE,
          align=PP_ALIGN.LEFT, italic=False, wrap=True):
    tb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = wrap
    p  = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size  = Pt(size)
    run.font.bold  = bold
    run.font.color.rgb = color
    run.font.italic = italic
    return tb

def accent_line(slide, l, t, w, color=ACCENT_CYAN, height=0.04):
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        Inches(l), Inches(t), Inches(w), Inches(height)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()

def badge(slide, text, l, t, w=1.8, h=0.38, bg=ACCENT_TEAL, fg=BG_DARK, size=11):
    sh = slide.shapes.add_shape(
        1, Inches(l), Inches(t), Inches(w), Inches(h)
    )
    sh.fill.solid()
    sh.fill.fore_color.rgb = bg
    sh.line.fill.background()
    tf = sh.text_frame
    tf.word_wrap = False
    p  = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.font.size  = Pt(size)
    run.font.bold  = True
    run.font.color.rgb = fg

def screenshot(slide, filename, l, t, w, h):
    path = os.path.join(SCREENSHOTS_DIR, filename)
    if os.path.exists(path):
        slide.shapes.add_picture(path, Inches(l), Inches(t), Inches(w), Inches(h))
    else:
        # Placeholder box if image not found
        sh = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
        sh.fill.solid()
        sh.fill.fore_color.rgb = RGBColor(0x1A, 0x1F, 0x35)
        sh.line.color.rgb = ACCENT_CYAN
        txbox(slide, f"[{filename}]", l+0.1, t+h/2-0.2, w-0.2, 0.4,
              size=9, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

def header(slide, title, subtitle=None):
    add_bg(slide)
    accent_line(slide, 0.4, 1.0, 12.5)
    txbox(slide, title, 0.4, 0.18, 12.5, 0.75, size=32, bold=True,
          color=WHITE, align=PP_ALIGN.LEFT)
    if subtitle:
        txbox(slide, subtitle, 0.4, 1.1, 12.5, 0.45, size=14,
              color=ACCENT_CYAN, align=PP_ALIGN.LEFT)

# ─────────────────────────────────────────────────────────────
# SLIDE 1 — TITLE
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
add_bg(s)

# Gradient top bar
bar = s.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.33), Inches(0.08))
bar.fill.solid(); bar.fill.fore_color.rgb = ACCENT_CYAN; bar.line.fill.background()

txbox(s, "🎓 CareerPath AI", 0.5, 1.2, 12.3, 1.1, size=48, bold=True,
      color=WHITE, align=PP_ALIGN.CENTER)
accent_line(s, 2.5, 2.45, 8.3)
txbox(s, "Discover Your Career.  Bridge Your Skill Gaps.  Build Your Future.",
      0.5, 2.6, 12.3, 0.6, size=18, color=ACCENT_CYAN, align=PP_ALIGN.CENTER, italic=True)

txbox(s, "AI-Powered Career Guidance & Personalized Skill Roadmap Platform for Indian Students",
      0.5, 3.3, 12.3, 0.5, size=13, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

# Team badges
for i,(name,role) in enumerate([
    ("👑 Parth Patil","Lead & Backend"),
    ("💻 Aditi Vispute","Frontend & Assessment"),
    ("🎨 Asmita Lokhande","UI/UX & Career Universe"),
    ("🗺️ Suyog Pawar","Roadmap & Presentation"),
]):
    x = 0.35 + i * 3.15
    badge(s, name, x, 4.25, w=2.85, h=0.38, bg=RGBColor(0x1A,0x25,0x3A), fg=WHITE, size=10)
    txbox(s, role, x, 4.65, 2.85, 0.3, size=9, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

txbox(s, "🏆 Hack2Ignite 2026–27  |  Team: 404 Brain Not Found  |  Problem: ED-02 — EduTech Track",
      0.5, 5.5, 12.3, 0.4, size=11, color=YELLOW, align=PP_ALIGN.CENTER, bold=True)
txbox(s, "🌐 careerpath-ai-jade.vercel.app",
      0.5, 6.0, 12.3, 0.35, size=12, color=ACCENT_TEAL, align=PP_ALIGN.CENTER, bold=True)

# Bottom bar
bot = s.shapes.add_shape(1, Inches(0), Inches(7.42), Inches(13.33), Inches(0.08))
bot.fill.solid(); bot.fill.fore_color.rgb = ACCENT_TEAL; bot.line.fill.background()

# ─────────────────────────────────────────────────────────────
# SLIDE 2 — PROBLEM
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "The Problem 🚨", "Why 80% of Indian Engineering Graduates Miss Industry Benchmarks")

problems = [
    ("❓ Career Blindness",
     "Students only know 3–4 'safe' paths.\nHigh-growth domains like Cloud, AI & DevOps are invisible."),
    ("📄 Resume Inflation",
     "Skills are self-reported without proof.\nNo verification = no employer trust."),
    ("🗓️ No Roadmap",
     "Generic advice leaves students without\na concrete week-by-week learning plan."),
    ("📊 TPO Blindspot",
     "Placement cells use static spreadsheets.\nSkill gaps discovered only after rejections."),
]
for i,(title,body) in enumerate(problems):
    col = i % 2; row = i // 2
    x = 0.4 + col * 6.35; y = 1.65 + row * 2.4
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(5.9), Inches(2.1))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x12,0x1A,0x2E)
    sh.line.color.rgb = RED
    txbox(s, title, x+0.15, y+0.1, 5.6, 0.45, size=14, bold=True, color=RED)
    txbox(s, body, x+0.15, y+0.6, 5.6, 1.3, size=11, color=LIGHT_GREY)

txbox(s, "💡 \"Students don't lack tutorials — they lack direction, honest feedback & disciplined execution.\"",
      0.4, 6.85, 12.5, 0.4, size=11, color=ACCENT_CYAN, italic=True, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────────────────────
# SLIDE 3 — SOLUTION
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "Our Solution — CareerPath AI ✅", "From Career Confusion to Job-Ready Competency")

pillars = [
    ("🎯","60/25/15 Match Engine",
     "Deterministic math: 60% Skill Depth\n25% Interest Overlap  +  15% Academics"),
    ("🔴🟡🟢","Tri-Color Skill Gap",
     "✅ Matched  ⚡ Needs Upgrade  ❌ Missing\nClear visual diagnosis for every career"),
    ("🗺️","Adaptive Roadmap",
     "4 / 8 / 12-week time-boxed plans\nCurated open-source resources per task"),
    ("💼","Live Job Telemetry",
     "Real Indian job vacancies + salaries\nvia Adzuna Developer API (live data)"),
    ("🤖","AI Career Mentor",
     "Groq Llama 3.3 70B < 500ms\nGoogle Gemini 2.0 Flash failover"),
    ("📊","Progress Dashboard",
     "3D Holographic Progress Orb\nTask completion → atomic %  update"),
]
for i,(icon,title,body) in enumerate(pillars):
    col = i % 3; row = i // 3
    x = 0.35 + col * 4.3; y = 1.65 + row * 2.45
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(4.0), Inches(2.2))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x10,0x1A,0x30)
    sh.line.color.rgb = ACCENT_TEAL
    txbox(s, icon, x+0.12, y+0.1, 0.5, 0.45, size=20)
    txbox(s, title, x+0.62, y+0.1, 3.25, 0.45, size=13, bold=True, color=ACCENT_CYAN)
    txbox(s, body, x+0.12, y+0.65, 3.75, 1.4, size=10, color=LIGHT_GREY)

# ─────────────────────────────────────────────────────────────
# SLIDE 4 — DEMO SCREENSHOTS
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "Live Platform Showcase 📸", "Production-Deployed at careerpath-ai-jade.vercel.app")

screens = [
    ("02_landing_hero_viewport.png",   0.35, 1.6, 5.9, 2.6,  "🌌 Landing Page & 3D Career Universe"),
    ("05_dashboard_top_viewport.png",  6.9,  1.6, 5.9, 2.6,  "📊 Student Dashboard & Progress Orb"),
    ("14_recommendations_top_card.png",0.35, 4.55,5.9, 2.6,  "🎯 AI Recommendations & Skill Gaps"),
    ("17_roadmap_page_full.png",       6.9,  4.55,5.9, 2.6,  "🗺️ Personalized Learning Roadmap"),
]
for (fname, l, t, w, h, cap) in screens:
    screenshot(s, fname, l, t, w, h)
    txbox(s, cap, l, t+h+0.03, w, 0.3, size=9.5, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────────────────────
# SLIDE 5 — DEMO FLOW
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "3-Minute Demo Flow ⚡", "Zero Friction — Evaluate the Full Platform in Under 3 Minutes")

steps = [
    ("1️⃣ Register","Enter any email & password\n→ JWT token, instant access"),
    ("2️⃣ Assessment","Academics + Interests\n+ 45+ Skills profiling"),
    ("3️⃣ Recommendations","60/25/15 score\n+ Tri-color skill gaps"),
    ("4️⃣ Live Jobs","Real Adzuna vacancies\n+ Indian CTC ranges"),
    ("5️⃣ Roadmap","8-week plan, task\ntoggle → live progress"),
    ("6️⃣ AI Mentor","Ask career questions\n< 500ms Groq response"),
]

arrow_col = RGBColor(0x2A, 0x3A, 0x55)
for i,(title,body) in enumerate(steps):
    x = 0.35 + i * 2.1; y = 2.0
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(1.85), Inches(3.5))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x0E,0x18,0x2C)
    sh.line.color.rgb = ACCENT_CYAN
    txbox(s, title, x+0.07, y+0.12, 1.72, 0.45, size=12, bold=True,
          color=ACCENT_CYAN, align=PP_ALIGN.CENTER)
    txbox(s, body, x+0.07, y+0.65, 1.72, 2.6, size=9.5, color=WHITE,
          align=PP_ALIGN.CENTER)
    if i < 5:
        ar = s.shapes.add_shape(1, Inches(x+1.93), Inches(y+1.5), Inches(0.17), Inches(0.4))
        ar.fill.solid(); ar.fill.fore_color.rgb = ACCENT_TEAL; ar.line.fill.background()

txbox(s, "🌐 Try it live → careerpath-ai-jade.vercel.app",
      0.35, 6.9, 12.5, 0.38, size=13, bold=True, color=YELLOW, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────────────────────
# SLIDE 6 — TECH STACK
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "Tech Stack & Architecture 🛠️", "Production-Ready, Sub-500ms Multi-Model Infrastructure")

layers = [
    ("🌐 Frontend",  ACCENT_CYAN,  "Vanilla JS (ES6+) + Three.js 3D WebGL\nCSS Grid/Flexbox — Hosted on Vercel CDN"),
    ("⚡ Backend",   ACCENT_TEAL,  "Node.js + Express REST API\nRate Limiting + Helmet Security — Render Cloud"),
    ("🗄️ Database",  YELLOW,       "MongoDB Atlas Cloud Cluster\nMongoose ODM + JWT Stateless Auth"),
    ("🤖 AI Layer",  RGBColor(0xA8,0x5C,0xFF),
                                  "Groq Llama 3.3 70B (< 500ms) + Gemini 2.0 Flash Failover\n860+ line Offline Question Fallback Bank"),
    ("💼 APIs",      GREEN,        "Adzuna Developer API — Live Indian Jobs & Salaries\nCloudinary — Resume & Avatar File Storage"),
]

for i,(layer,col,desc) in enumerate(layers):
    y = 1.6 + i * 1.02
    # left colored bar
    sh = s.shapes.add_shape(1, Inches(0.35), Inches(y), Inches(0.12), Inches(0.78))
    sh.fill.solid(); sh.fill.fore_color.rgb = col; sh.line.fill.background()
    # content box
    sh2 = s.shapes.add_shape(1, Inches(0.55), Inches(y), Inches(12.3), Inches(0.78))
    sh2.fill.solid(); sh2.fill.fore_color.rgb = RGBColor(0x0E,0x18,0x2C); sh2.line.fill.background()
    txbox(s, layer, 0.65, y+0.04, 2.2, 0.45, size=13, bold=True, color=col)
    txbox(s, desc,  2.9,  y+0.04, 9.8, 0.65, size=11, color=LIGHT_GREY)

# ─────────────────────────────────────────────────────────────
# SLIDE 7 — COMPETITIVE MATRIX
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "Why CareerPath AI Wins 🏆", "Competitive Matrix vs Existing Solutions")

cols = ["Feature", "Generic Quizzes", "YouTube / Blogs", "CareerPath AI ✅"]
rows = [
    ["Recommendation Basis", "Black-box personality", "Generic search query", "60/25/15 Deterministic Math"],
    ["Skill Verification",   "❌ Self-reported",       "❌ None",             "✅ GitHub + AI Quiz"],
    ["Actionable Roadmap",   "❌ Ends at quiz",        "⚠️ Scattered videos", "✅ 4/8/12-Week Plan"],
    ["Progress Tracking",    "❌ None",                "❌ None",             "✅ Live % + Tasks"],
    ["Live Market Salaries", "❌ Static estimates",    "⚠️ Outdated posts",   "✅ Adzuna API Live"],
    ["Student Cost",         "₹500–₹5,000/report",    "Free",               "100% Free Always 🎉"],
]

col_widths = [2.8, 2.6, 2.6, 2.8]
col_starts = [0.35, 3.2, 5.85, 8.5]
row_h = 0.68

# Header row
for c,(cname,cx,cw) in enumerate(zip(cols, col_starts, col_widths)):
    hdr = s.shapes.add_shape(1, Inches(cx), Inches(1.65), Inches(cw-0.05), Inches(0.55))
    hdr.fill.solid()
    hdr.fill.fore_color.rgb = ACCENT_TEAL if c == 3 else RGBColor(0x14,0x20,0x36)
    hdr.line.fill.background()
    txbox(s, cname, cx+0.07, 1.68, cw-0.15, 0.45, size=11, bold=True,
          color=BG_DARK if c==3 else WHITE, align=PP_ALIGN.CENTER)

for r,row in enumerate(rows):
    y = 2.28 + r * row_h
    bg = RGBColor(0x0C,0x16,0x28) if r%2==0 else RGBColor(0x10,0x1C,0x30)
    for c,(cell,cx,cw) in enumerate(zip(row, col_starts, col_widths)):
        bx = s.shapes.add_shape(1, Inches(cx), Inches(y), Inches(cw-0.05), Inches(row_h-0.06))
        bx.fill.solid()
        bx.fill.fore_color.rgb = RGBColor(0x14,0x28,0x1A) if c==3 else bg
        bx.line.fill.background()
        col_text = GREEN if c==3 else (RED if "❌" in cell else LIGHT_GREY)
        txbox(s, cell, cx+0.07, y+0.08, cw-0.15, row_h-0.18, size=9.5,
              color=col_text, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────────────────────
# SLIDE 8 — BUSINESS MODEL
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "Business Model 💰", "Sustainable B2B2C Talent & Telemetry Flywheel")

txbox(s, "🎓 Free for Students — Always.", 0.35, 1.65, 12.5, 0.5,
      size=20, bold=True, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)

streams = [
    ("🏫 College Placement SaaS",  "₹1.5L – ₹3.5L / year",
     "Annual TPO portal license:\nBatch skill heatmaps + NAAC/NIRF reports"),
    ("🏢 Recruiter Talent Pass",    "₹24,999 / month",
     "Direct access to pre-screened,\nproof-of-work engineering candidates"),
    ("📜 Certification Referrals", "15–25% Revenue Share",
     "Contextual, labeled sponsored\ncertification vouchers"),
]
for i,(title,price,body) in enumerate(streams):
    x = 0.35 + i * 4.2; y = 2.4
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(3.9), Inches(3.4))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x0E,0x1A,0x10)
    sh.line.color.rgb = GREEN
    txbox(s, title, x+0.12, y+0.15, 3.65, 0.5, size=13, bold=True, color=WHITE)
    txbox(s, price, x+0.12, y+0.72, 3.65, 0.45, size=18, bold=True, color=GREEN)
    txbox(s, body,  x+0.12, y+1.3,  3.65, 1.9,  size=10.5, color=LIGHT_GREY)

txbox(s, "High-volume student pipeline → institutional monetization → no student ever pays.",
      0.35, 6.6, 12.5, 0.45, size=11, color=ACCENT_TEAL, italic=True, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────────────────────
# SLIDE 9 — FUTURE ROADMAP
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
header(s, "Future Roadmap 🚀", "The Vision Beyond the Hackathon")

phases = [
    ("Phase 1\nMVP — Now ✅",  ACCENT_TEAL, [
        "✅ 60/25/15 Matching Engine",
        "✅ Tri-color Skill Gap Analysis",
        "✅ Three.js 3D WebGL Universe",
        "✅ Live Adzuna Job Telemetry",
        "✅ Groq + Gemini AI Mentor",
        "✅ Adaptive 4/8/12-wk Roadmap",
    ]),
    ("Phase 2\nQ4 2026",  ACCENT_CYAN, [
        "📄 AI Resume ATS Parser (OCR)",
        "💻 In-Browser Code Sandbox",
        "🔗 GitHub Commit Proof-of-Work",
        "🌐 Multilingual UI (Hindi/Marathi)",
        "👥 Peer Study Circles",
    ]),
    ("Phase 3\nQ1–Q2 2027", YELLOW, [
        "🎙️ AI Voice Mock Interviewer",
        "📱 WhatsApp Streak Bot",
        "🏫 College TPO Admin Portal",
        "🏢 Corporate Hiring Gateway",
        "📜 Verified Certifications",
    ]),
]

for i,(phase,col,items) in enumerate(phases):
    x = 0.35 + i * 4.2; y = 1.65
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(3.9), Inches(5.6))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x0C,0x16,0x26)
    sh.line.color.rgb = col
    # phase title box
    ph = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(3.9), Inches(0.7))
    ph.fill.solid(); ph.fill.fore_color.rgb = col; ph.line.fill.background()
    txbox(s, phase, x+0.1, y+0.05, 3.7, 0.6, size=11, bold=True,
          color=BG_DARK, align=PP_ALIGN.CENTER)
    for j,item in enumerate(items):
        txbox(s, item, x+0.15, y+0.82+j*0.76, 3.6, 0.65, size=10.5, color=LIGHT_GREY)

# ─────────────────────────────────────────────────────────────
# SLIDE 10 — CONCLUSION
# ─────────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK_LAYOUT)
add_bg(s)

# Top glow bar
bar = s.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.33), Inches(0.1))
bar.fill.solid(); bar.fill.fore_color.rgb = ACCENT_CYAN; bar.line.fill.background()

txbox(s, "Thank You! 🙏", 0.5, 0.6, 12.3, 0.85, size=42, bold=True,
      color=WHITE, align=PP_ALIGN.CENTER)
accent_line(s, 2.5, 1.6, 8.3)
txbox(s, "CareerPath AI — The GPS for Engineering Careers in India",
      0.5, 1.75, 12.3, 0.55, size=18, color=ACCENT_CYAN,
      align=PP_ALIGN.CENTER, italic=True)

summary_pts = [
    "✅  Solves Problem ED-02 with explainable, market-grounded AI career guidance",
    "✅  100% Original — Built from scratch by Team 404 Brain Not Found",
    "✅  Live & Production-tested on Vercel (frontend) + Render (backend) + MongoDB Atlas",
    "✅  < 500ms AI inference  |  < 50ms recommendation engine  |  60 FPS Three.js 3D",
]
for i,pt in enumerate(summary_pts):
    txbox(s, pt, 1.5, 2.55+i*0.62, 10.3, 0.52, size=12.5, color=LIGHT_GREY)

# CTA box
cta = s.shapes.add_shape(1, Inches(2.0), Inches(5.3), Inches(9.3), Inches(0.8))
cta.fill.solid(); cta.fill.fore_color.rgb = ACCENT_TEAL; cta.line.fill.background()
txbox(s, "🌐  Try Now →  careerpath-ai-jade.vercel.app", 2.0, 5.35, 9.3, 0.65,
      size=18, bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)

# Team row
for i,(name,role) in enumerate([
    ("👑 Parth Patil","Lead & Backend"),
    ("💻 Aditi Vispute","Frontend & Assessment"),
    ("🎨 Asmita Lokhande","UI/UX & Career Universe"),
    ("🗺️ Suyog Pawar","Roadmap & Presentation"),
]):
    x = 0.35 + i * 3.15
    txbox(s, name, x, 6.3, 2.9, 0.38, size=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txbox(s, role, x, 6.68, 2.9, 0.3, size=8.5, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

# Open for Q&A
txbox(s, "We are now open for your questions! ❓",
      0.5, 7.1, 12.3, 0.3, size=11, color=YELLOW, italic=True, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────────────────────
OUTPUT = "CareerPath_AI_Hack2Ignite_PPT.pptx"
prs.save(OUTPUT)
print(f"\n[OK] PPT saved successfully -> {os.path.abspath(OUTPUT)}")
print("     Open the file in PowerPoint or Google Slides!")
