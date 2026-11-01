"""Generates the theme-aware SVGs (logo + architecture) for the README. Pure stdlib."""
from pathlib import Path
PUB = Path(__file__).resolve().parent.parent / "docs/public"
PUB.mkdir(parents=True, exist_ok=True)
FONT = "SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

def paw(x, y, s, fill, op):
    return (f'<g transform="translate({x},{y}) scale({s})" fill="{fill}" opacity="{op}">'
            '<ellipse cx="0" cy="0.35" rx="0.58" ry="0.46"/>'
            '<circle cx="-0.64" cy="-0.42" r="0.23"/><circle cx="-0.22" cy="-0.76" r="0.25"/>'
            '<circle cx="0.22" cy="-0.76" r="0.25"/><circle cx="0.64" cy="-0.42" r="0.23"/></g>')

def logo(theme):
    text = "#e6edf3" if theme == "dark" else "#1f2328"
    sub = "#8b949e" if theme == "dark" else "#57606a"
    acc = "#f0883e"
    paws = "".join(paw(60 + i * 95, 170 if i % 2 == 0 else 110, 48, acc, round(0.35 + 0.65 * i / 3, 2)) for i in range(4))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300" role="img" aria-label="claude-trail">
{paws}
<text x="430" y="175" font-family="{FONT}" font-size="112" font-weight="700" fill="{text}">claude-trail</text>
<text x="436" y="238" font-family="{FONT}" font-size="34" fill="{sub}">a flight recorder for Claude Code</text>
</svg>
'''

def architecture(theme):
    dark = theme == "dark"
    bg = "#0d1117" if dark else "#ffffff"; box = "#161b22" if dark else "#f6f8fa"; line = "#30363d" if dark else "#d0d7de"
    text = "#e6edf3" if dark else "#1f2328"; sub = "#8b949e" if dark else "#57606a"; acc = "#f0883e"
    def rect(x, y, w, h, title, items, accent=False):
        out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{box}" stroke="{acc if accent else line}" stroke-width="{2 if accent else 1.5}"/>',
               f'<text x="{x + w/2}" y="{y + 32}" text-anchor="middle" font-family="{FONT}" font-size="17" font-weight="700" fill="{acc if accent else text}">{title}</text>']
        for i, it in enumerate(items):
            out.append(f'<text x="{x + 18}" y="{y + 64 + i * 26}" font-family="{FONT}" font-size="14" fill="{text}">{it}</text>')
        return "\n".join(out)
    def arrow(x1, y1, x2, y2, label=""):
        s = f'<path d="M{x1},{y1} C{x1+40},{y1} {x2-40},{y2} {x2},{y2}" fill="none" stroke="{sub}" stroke-width="2" marker-end="url(#a)"/>'
        if label: s += f'<text x="{(x1+x2)/2}" y="{min(y1,y2) - 8}" text-anchor="middle" font-family="{FONT}" font-size="12" fill="{sub}">{label}</text>'
        return s
    hooks = ["SessionStart", "UserPromptSubmit", "PostToolUse", "Stop", "SessionEnd"]
    lenses = ["🤝 handoff   → HANDOFF.md", "🔍 blame     → terminal", "💸 cost      → status line", "🌱 rules     → CLAUDE.md", "📰 digest    → Telegram", "🗄️ vault     → Obsidian", "🛂 passport  → memory-passport"]
    body = "\n".join([
        f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{sub}"/></marker></defs>',
        f'<rect width="1000" height="420" fill="{bg}"/>',
        rect(30, 90, 220, 210, "Claude Code hooks", hooks),
        rect(330, 60, 300, 270, ".claude-trail/events.jsonl", ["one line per event", "redacted at write time", "&lt;private&gt; dropped", "gitignored by default", "no daemon, no database", "no network, no API key", "&lt; 50 ms per hook"], accent=True),
        rect(720, 30, 260, 340, "seven lenses", lenses),
        arrow(250, 195, 330, 195, "append"),
        arrow(630, 195, 720, 195, "read"),
        f'<text x="500" y="400" text-anchor="middle" font-family="{FONT}" font-size="13" fill="{sub}">SessionStart reads the log back and injects a short handoff. Everything else is a CLI you run when you want it.</text>',
    ])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 420" width="1000" height="420" role="img" aria-label="claude-trail architecture">\n{body}\n</svg>\n'

for th in ("light", "dark"):
    (PUB / f"logo-{th}.svg").write_text(logo(th))
    (PUB / f"architecture-{th}.svg").write_text(architecture(th))
print("svgs written")
