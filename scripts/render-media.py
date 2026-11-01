"""
Renders the README media from REAL captured CLI output (scripts/.demo/out/*.txt).
Run:  npm run media      (uses: uv run --with pillow python scripts/render-media.py)
No screen recording. If the CLI output changes, the GIF changes.
"""
from __future__ import annotations
import os, sys, re, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts/.demo/out"
PUB = ROOT / "docs/public"
PUB.mkdir(parents=True, exist_ok=True)

MONO = "/System/Library/Fonts/Menlo.ttc"
CJK = "/System/Library/Fonts/Hiragino Sans GB.ttc"
EMOJI = "/System/Library/Fonts/Apple Color Emoji.ttc"
SIZE = 15; LH = 24; PAD = 26; CHROME = 44
BG = (13, 17, 23); FG = (201, 209, 217); DIM = (110, 118, 129); ACC = (240, 136, 62)
GREEN = (63, 185, 80); YEL = (210, 153, 34); BLUE = (88, 166, 255); PURPLE = (188, 140, 255); RED = (248, 81, 73)

mono = ImageFont.truetype(MONO, SIZE, index=0)
mono_b = ImageFont.truetype(MONO, SIZE, index=1)
cjk = ImageFont.truetype(CJK, SIZE)
CW = mono.getlength("M")
try:
    emoji_font = ImageFont.truetype(EMOJI, 160)
except Exception:
    emoji_font = None
_emoji_cache: dict[str, Image.Image] = {}

def is_emoji(ch: str) -> bool:
    o = ord(ch)
    return (0x1F300 <= o <= 0x1FAFF) or (0x2600 <= o <= 0x27BF) or o in (0x2B50, 0x2705, 0x274C, 0x26A0, 0x2139)
def is_cjk(ch: str) -> bool:
    o = ord(ch)
    return (0x2E80 <= o <= 0x9FFF) or (0x3000 <= o <= 0x303F) or (0xFF00 <= o <= 0xFFEF) or (0xAC00 <= o <= 0xD7AF)
def cells(ch: str) -> int:
    if ch in ("️", "‍"): return 0
    return 2 if (is_emoji(ch) or is_cjk(ch)) else 1

def emoji_img(ch: str, h: int) -> Image.Image | None:
    if emoji_font is None: return None
    if ch in _emoji_cache: return _emoji_cache[ch]
    try:
        im = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((20, 10), ch, font=emoji_font, embedded_color=True)
        bbox = im.getbbox()
        if not bbox: return None
        im = im.crop(bbox)
        s = h / max(im.size)
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
        _emoji_cache[ch] = im
        return im
    except Exception:
        return None

RULES = [
    (re.compile(r"^[^\n]*(trail (blame|cost|rules|digest|handoff|vault|status)|claude-trail ·|HANDOFF|交接记录)[^\n]*$"), ACC, True),
    (re.compile(r"🐾 [0-9a-f]{6}"), YEL, False),
    (re.compile(r"\$\d+(\.\d+)?"), GREEN, True),
    (re.compile(r"×\d+"), GREEN, True),
    (re.compile(r"\b(human|人工)\b"), DIM, False),
    (re.compile(r"[│─]+"), DIM, False),
    (re.compile(r"`[^`]+`"), BLUE, False),
    (re.compile(r"\*\*[^*]+\*\*"), FG, True),
    (re.compile(r"^(#+ .*|### .*)$"), PURPLE, True),
    (re.compile(r"^(session|when|model|tokens|edits|usd|会话|时间|模型|编辑|美元)(\s{2,}\S+)*\s*$"), DIM, False),
    (re.compile(r"(opus|sonnet|haiku|fable)-[\d-]+"), PURPLE, False),
    (re.compile(r"\d{4}-\d{2}-\d{2}|\d{1,2} \w{3}, \d{2}:\d{2}|\d{1,2}月\d{1,2}日 \d{2}:\d{2}"), DIM, False),
    (re.compile(r"⚠️[^\n]*"), YEL, False),
    (re.compile(r"\(exact\)|（精确）"), GREEN, False),
]

def colorize(line: str):
    cols = [(FG, False)] * len(line)
    for rx, color, bold in RULES:
        for m in rx.finditer(line):
            for i in range(m.start(), m.end()): cols[i] = (color, bold)
    return cols

def draw_line(draw: ImageDraw.ImageDraw, img: Image.Image, x0: float, y: int, line: str, override=None, maxcols: int = 10_000):
    cols = colorize(line) if override is None else [(override, False)] * len(line)
    col = 0
    for i, ch in enumerate(line):
        c = cells(ch)
        if c == 0: continue
        if col + c > maxcols - 1:
            draw.text((x0 + col * CW, y + 3), "…", font=mono, fill=DIM); break
        x = x0 + col * CW
        color, bold = cols[i]
        if is_emoji(ch):
            im = emoji_img(ch, LH - 6)
            if im is not None: img.paste(im, (int(x), y + 2), im)
            else: draw.ellipse((x + 2, y + 6, x + 14, y + 18), fill=ACC)
        elif is_cjk(ch):
            draw.text((x, y + 1), ch, font=cjk, fill=color)
        else:
            draw.text((x, y + 3), ch, font=mono_b if bold else mono, fill=color)
        col += c

def frame(width: int, height: int, lines: list[tuple[str, object]], title="claude-trail") -> Image.Image:
    img = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, width - 1, height - 1), radius=14, fill=BG, outline=(48, 54, 61))
    d.rectangle((1, 1, width - 2, CHROME), fill=(22, 27, 34))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse((16 + i * 22, 15, 30 + i * 22, 29), fill=c)
    tw = mono.getlength(title)
    d.text(((width - tw) / 2, 13), title, font=mono, fill=DIM)
    y = CHROME + PAD - 6
    maxcols = int((width - 2 * PAD) / CW)
    for text, override in lines:
        draw_line(d, img, PAD, y, text, override, maxcols)
        y += LH
    return img

def read(name: str) -> list[str]:
    return (OUT / f"{name}.txt").read_text().rstrip("\n").split("\n")

PROMPT = "~/project $ "

def png(name: str, cmd: str | None, body: list[str], width=1000, out: str | None = None, title="claude-trail"):
    lines: list[tuple[str, object]] = []
    if cmd:
        lines.append((PROMPT + cmd, None))
    lines += [(l, None) for l in body]
    h = CHROME + PAD * 2 + LH * len(lines)
    img = frame(width, h, lines, title)
    # colour the prompt line
    if cmd:
        d = ImageDraw.Draw(img)
        d.rectangle((PAD - 2, CHROME + PAD - 6, width - PAD, CHROME + PAD - 6 + LH), fill=BG)
        draw_line(d, img, PAD, CHROME + PAD - 6, PROMPT, GREEN)
        draw_line(d, img, PAD + len(PROMPT) * CW, CHROME + PAD - 6, cmd, FG)
    img.save(PUB / (out or f"{name}.png"), optimize=True)
    print("png", out or f"{name}.png", img.size)

def gif(scenes: list[tuple[str, list[str]]], out="demo.gif", width=1000, height=640, title="claude-trail"):
    frames: list[Image.Image]; durs: list[int]
    frames, durs = [], []
    maxlines = (height - CHROME - PAD * 2) // LH
    def add(lines, dur, typing=None):
        img = frame(width, height, lines, title)
        if typing is not None:
            d = ImageDraw.Draw(img)
            y = CHROME + PAD - 6 + LH * (len(lines) - 1)
            d.rectangle((PAD - 2, y, width - PAD, y + LH), fill=BG)
            draw_line(d, img, PAD, y, PROMPT, GREEN)
            draw_line(d, img, PAD + len(PROMPT) * CW, y, typing + "▍", FG)
        frames.append(img.convert("P", palette=Image.ADAPTIVE, colors=96)); durs.append(dur)
    for cmd, body in scenes:
        body = body[:maxlines - 2]
        for i in range(0, len(cmd) + 1, 3):
            add([("", None)], 45, typing=cmd[:i])
        add([("", None)], 350, typing=cmd)
        shown: list[tuple[str, object]] = [(PROMPT + cmd, None)]
        for i in range(0, len(body), 3):
            shown = [(PROMPT + cmd, None)] + [(l, None) for l in body[: i + 3]]
            add(shown, 55)
        add(shown, 3200)
    frames[0].save(PUB / out, save_all=True, append_images=frames[1:], duration=durs, loop=0, optimize=True, disposal=1)
    print("gif", out, len(frames), "frames", os.path.getsize(PUB / out) // 1024, "KB")

def logo_png():
    W, H = 1280, 640
    img = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(img)
    def paw(cx, cy, s, color, angle=0):
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        ld.ellipse((cx - s * 0.55, cy - s * 0.1, cx + s * 0.55, cy + s * 0.75), fill=color)
        for k, (dx, dy, r) in enumerate([(-0.62, -0.45, 0.22), (-0.22, -0.78, 0.24), (0.22, -0.78, 0.24), (0.62, -0.45, 0.22)]):
            ld.ellipse((cx + dx * s - r * s, cy + dy * s - r * s, cx + dx * s + r * s, cy + dy * s + r * s), fill=color)
        img.alpha_composite(layer)
    xs = [170, 330, 490, 650, 810, 970, 1130]; ys = [250, 180, 250, 180, 250, 180, 250]
    for i, (x, y) in enumerate(zip(xs, ys)):
        a = int(60 + 195 * i / 6)
        paw(x, y, 62, (240, 136, 62, a))
    d = ImageDraw.Draw(img)
    big = ImageFont.truetype(MONO, 104, index=1)
    small = ImageFont.truetype(MONO, 30, index=0)
    tiny = ImageFont.truetype(MONO, 24, index=0)
    tw = big.getlength("claude-trail")
    d.text(((W - tw) / 2, 350), "claude-trail", font=big, fill=(230, 237, 243, 255))
    t2 = "a flight recorder for Claude Code · one log, seven lenses"
    d.text(((W - small.getlength(t2)) / 2, 480), t2, font=small, fill=(140, 148, 158, 255))
    t3 = "🤝 handoff  🔍 blame  💸 cost  🌱 rules  📰 digest  🗄️ vault  🛂 passport   English · 中文"
    x = (W - sum(cells(c) for c in t3) * tiny.getlength("M")) / 2
    col = 0
    for ch in t3:
        c = cells(ch)
        if c == 0: continue
        if is_emoji(ch):
            im = emoji_img(ch, 30)
            if im is not None: img.paste(im, (int(x + col * tiny.getlength("M")), 550), im)
        elif is_cjk(ch):
            d.text((x + col * tiny.getlength("M"), 548), ch, font=ImageFont.truetype(CJK, 24), fill=(201, 209, 217, 255))
        else:
            d.text((x + col * tiny.getlength("M"), 550), ch, font=tiny, fill=(201, 209, 217, 255))
        col += c
    img.convert("RGB").save(PUB / "social.png", optimize=True)
    print("png social.png")

def icon_png():
    S = 1024
    img = Image.new("RGBA", (S, S), BG + (255,))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, S - 1, S - 1), radius=200, fill=BG + (255,))
    cx, cy, s = S / 2, S / 2 + 40, 330
    d.ellipse((cx - s * 0.58, cy - s * 0.1, cx + s * 0.58, cy + s * 0.78), fill=ACC)
    for dx, dy, r in [(-0.66, -0.46, 0.24), (-0.23, -0.82, 0.26), (0.23, -0.82, 0.26), (0.66, -0.46, 0.24)]:
        d.ellipse((cx + dx * s - r * s, cy + dy * s - r * s, cx + dx * s + r * s, cy + dy * s + r * s), fill=ACC)
    img.convert("RGB").save(ROOT / ".claude-plugin/icon.png", optimize=True)
    print("png .claude-plugin/icon.png")

if __name__ == "__main__":
    icon_png()
    logo_png()
    png("blame", "trail blame src/retry.ts", read("blame"))
    png("cost", "trail cost", read("cost"))
    png("rules", "trail rules", read("rules"))
    png("handoff", "trail handoff --print", read("handoff"))
    png("digest", "trail digest --since 7d", read("digest"))
    png("vault", "cat '.claude-trail/vault/Claude Trail/project/sessions/'*.md", read("vault-note"))
    png("passport", "cat .claude-trail/passport/preferences.md", read("passport"))
    png("sessionstart", None, read("sessionstart"), title="Claude Code · SessionStart context")
    png("sessionstart-zh", None, read("sessionstart-zh"), title="Claude Code · SessionStart context (中文)")
    png("handoff-zh", "TRAIL_LANG=zh trail handoff --print", read("handoff-zh"))
    png("cost-zh", "TRAIL_LANG=zh trail cost", read("cost-zh"))
    gif([
        ("trail blame src/retry.ts", read("blame")),
        ("trail cost", read("cost")),
        ("trail rules", read("rules")),
        ("TRAIL_LANG=zh trail digest --since 7d", read("digest-zh")),
    ])
    gif([("trail handoff --print", read("handoff"))], out="handoff.gif", height=820)
