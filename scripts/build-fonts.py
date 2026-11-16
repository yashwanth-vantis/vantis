#!/usr/bin/env python3
"""Build self-hosted font files, metric-matched fallbacks and the outlined logos.

Run from the project root:  python3 -I scripts/build-fonts.py
Requires: fonttools, brotli, uharfbuzz.

Outputs
  src/assets/fonts/*.woff2          trimmed variable fonts (latin only)
  src/styles/fallbacks.generated.css  @font-face fallbacks with size-adjust etc.
  src/components/logo-paths.generated.ts  outlined PANRIGHT wordmark (wdth 125, wght 500)
"""
import io, json, os, shutil
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

ROOT = os.getcwd()
NM = os.path.join(ROOT, "node_modules")
OUT = os.path.join(ROOT, "src/assets/fonts")
os.makedirs(OUT, exist_ok=True)

ARCHIVO = f"{NM}/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2"
HANKEN = f"{NM}/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2"
PLEX = {w: f"{NM}/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-{w}-normal.woff2" for w in (400, 500)}
ARIAL_METRIC = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"  # metric-compatible with Arial


def save_woff2(font, path):
    font.flavor = "woff2"
    font.save(path)
    print(f"  {os.path.basename(path)}  {os.path.getsize(path)/1024:.1f} KB")


# 1. Trim variable axes to the ranges tokens.css actually uses ------------------
print("fonts")
a = TTFont(ARCHIVO)
a = instancer.instantiateVariableFont(a, {"wght": (400, 600), "wdth": (100, 125)})
save_woff2(a, f"{OUT}/archivo-latin-var.woff2")

h = TTFont(HANKEN)
h = instancer.instantiateVariableFont(h, {"wght": (400, 500)})
save_woff2(h, f"{OUT}/hanken-grotesk-latin-var.woff2")

for w, p in PLEX.items():
    shutil.copy(p, f"{OUT}/ibm-plex-mono-latin-{w}.woff2")
    print(f"  ibm-plex-mono-latin-{w}.woff2  {os.path.getsize(p)/1024:.1f} KB")


# 2. Metric-matched fallbacks (capsize method: frequency-weighted avg width) ---
FREQ = {  # English letter frequency incl. space, approximated
    "a": .0668, "b": .0122, "c": .0228, "d": .0348, "e": .1040, "f": .0182, "g": .0165, "h": .0498,
    "i": .0570, "j": .0013, "k": .0063, "l": .0329, "m": .0197, "n": .0552, "o": .0614, "p": .0158,
    "q": .0008, "r": .0490, "s": .0517, "t": .0742, "u": .0225, "v": .0080, "w": .0193, "x": .0012,
    "y": .0161, "z": .0006, " ": .1818,
}
UPPER = {c.upper(): v for c, v in FREQ.items() if c != " "} | {" ": .12}


def avg_width(path_or_font, location=None, freq=FREQ):
    if isinstance(path_or_font, str):
        data = open(path_or_font, "rb").read()
    else:
        buf = io.BytesIO(); path_or_font.flavor = None; path_or_font.save(buf); data = buf.getvalue()
    face = hb.Face(data); font = hb.Font(face)
    if location:
        font.set_variations(location)
    upem = face.upem
    total = 0
    for ch, f in freq.items():
        buf = hb.Buffer(); buf.add_str(ch); buf.guess_segment_properties()
        hb.shape(font, buf, {"kern": False})
        total += buf.glyph_positions[0].x_advance / upem * f
    return total / sum(freq.values())


def full_font_bytes(path):
    t = TTFont(path); t.flavor = None
    b = io.BytesIO(); t.save(b); return b.getvalue()

arial_avg = avg_width(ARIAL_METRIC)
arial_upper = avg_width(ARIAL_METRIC, freq=UPPER)

def to_ttf_bytes(path):
    t = TTFont(path); t.flavor = None; b = io.BytesIO(); t.save(b); return b

def write_bytes_tmp(path):
    tmp = f"/tmp/{os.path.basename(path)}.ttf"
    t = TTFont(path); t.flavor = None; t.save(tmp); return tmp

archivo_ttf = write_bytes_tmp(ARCHIVO)
hanken_ttf = write_bytes_tmp(HANKEN)
plex_ttf = write_bytes_tmp(PLEX[400])

def metrics(path):
    t = TTFont(path); upem = t["head"].unitsPerEm; hh = t["hhea"]
    return hh.ascent / upem, -hh.descent / upem, hh.lineGap / upem

fallbacks = []
def face(name, local_srcs, target_avg, ref_avg, m):
    size_adjust = target_avg / ref_avg
    asc, desc, gap = m
    fallbacks.append(
        "@font-face {\n"
        f"  font-family: \"{name}\";\n"
        f"  src: {', '.join(f'local(\"{s}\")' for s in local_srcs)};\n"
        f"  size-adjust: {size_adjust*100:.2f}%;\n"
        f"  ascent-override: {asc/size_adjust*100:.2f}%;\n"
        f"  descent-override: {desc/size_adjust*100:.2f}%;\n"
        f"  line-gap-override: {gap/size_adjust*100:.2f}%;\n"
        "}\n"
    )

ARIAL_LOCAL = ["Arial", "ArialMT", "Liberation Sans", "Helvetica Neue", "Helvetica"]
face("Archivo Fallback", ARIAL_LOCAL, avg_width(archivo_ttf, {"wght": 500, "wdth": 100}), arial_avg, metrics(archivo_ttf))
# Display text is uppercase at wdth 125: match uppercase width so the hero does not reflow on swap.
face("Archivo Expanded Fallback", ARIAL_LOCAL, avg_width(archivo_ttf, {"wght": 500, "wdth": 125}, UPPER), arial_upper, metrics(archivo_ttf))
face("Hanken Grotesk Fallback", ARIAL_LOCAL, avg_width(hanken_ttf, {"wght": 400}), arial_avg, metrics(hanken_ttf))
COURIER = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
face("IBM Plex Mono Fallback", ["Courier New", "CourierNewPSMT", "Liberation Mono", "Menlo"], avg_width(plex_ttf), avg_width(COURIER), metrics(plex_ttf))

with open(os.path.join(ROOT, "src/styles/fallbacks.generated.css"), "w") as fh:
    fh.write("/* Generated by scripts/build-fonts.py. Metric-matched local fallbacks (no CLS on font swap). */\n")
    fh.write("".join(fallbacks))
print("fallbacks written")


# 3. Outline the wordmark: Archivo wdth 125, wght 500, size 40, tracking 1.6 ----
static = instancer.instantiateVariableFont(TTFont(archivo_ttf), {"wght": 500, "wdth": 125})
static_path = "/tmp/archivo-500-125.ttf"; static.save(static_path)
data = open(static_path, "rb").read()
hface = hb.Face(data); hfont = hb.Font(hface)
upem = hface.upem
buf = hb.Buffer(); buf.add_str("PANRIGHT"); buf.guess_segment_properties()
hb.shape(hfont, buf, {"kern": True, "liga": False})
size, tracking = 40.0, 1.6
scale = size / upem
gs = static.getGlyphSet()
order = static.getGlyphOrder()
# SVG <text> with letter-spacing adds spacing after every glyph incl. the last;
# text-anchor="end" anchors the end of the advance (incl. trailing spacing).
advances = [p.x_advance * scale + tracking for p in buf.glyph_positions]
total = sum(advances)
x = 282 - total
baseline = 38
d_parts = []
for info, pos, adv in zip(buf.glyph_infos, buf.glyph_positions, advances):
    gname = order[info.codepoint]
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    tpen = TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, baseline))
    gs[gname].draw(tpen)
    d_parts.append(pen.getCommands())
    x += adv
wordmark = " ".join(d_parts)
ts = (
    "// Generated by scripts/build-fonts.py. Archivo wdth 125 / wght 500, 40px, tracking 1.6, outlined.\n"
    f"export const WORDMARK_PATH = {json.dumps(wordmark)};\n"
    f"export const WORDMARK_START_X = {282 - total:.2f};\n"
)
with open(os.path.join(ROOT, "src/components/logo-paths.generated.ts"), "w") as fh:
    fh.write(ts)
print(f"wordmark outlined, starts at x={282-total:.2f}")
