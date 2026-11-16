#!/usr/bin/env python3
"""Build Barkeys icons with text outlined to paths (no font needed at runtime).

Usage: python3 build-icons.py /path/to/GoogleSansFlex_24pt-ExtraBold.ttf
Writes ../icons/icon.svg (48 px and up) and ../icons/icon-small.svg (16/32 px).
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

INK = "#181721"
DEEP, MID = "#a7003b", "#d60042"


def text_path(font, text, size, cx, cy):
    """SVG path for `text`, scaled to `size` px, visually centred on (cx, cy)."""
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    scale = size / font["head"].unitsPerEm

    # Measure ink bounds of the whole run.
    x = 0
    bounds = None
    for ch in text:
        name = cmap[ord(ch)]
        bp = BoundsPen(gs)
        gs[name].draw(TransformPen(bp, (1, 0, 0, 1, x, 0)))
        if bp.bounds:
            b = bp.bounds
            bounds = b if bounds is None else (
                min(bounds[0], b[0]), min(bounds[1], b[1]), max(bounds[2], b[2]), max(bounds[3], b[3]))
        x += gs[name].width
    xmin, ymin, xmax, ymax = bounds
    ox = cx - (xmin + xmax) / 2 * scale
    oy = cy + (ymin + ymax) / 2 * scale  # y is flipped below

    pen = SVGPathPen(gs)
    x = 0
    for ch in text:
        name = cmap[ord(ch)]
        # font units -> px, flip y
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, ox + x * scale, oy)))
        x += gs[name].width
    return pen.getCommands()


def main(font_file):
    font = TTFont(font_file)
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)

    grad = f'''<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{DEEP}"/><stop offset=".6" stop-color="{MID}"/></linearGradient>'''

    big = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>{grad}</defs>
  <rect x="4" y="4" width="88" height="88" rx="26" fill="url(#g)"/>
  <rect x="12" y="32" width="72" height="32" rx="16" fill="#fff"/>
  <rect x="17" y="37" width="36" height="22" rx="11" fill="{INK}"/>
  <path fill="#fff" d="{text_path(font, "@b", 17, 35, 48)}"/>
  <path d="M61 48h14m-6-6 6 6-6 6" stroke="{MID}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
'''
    small = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>{grad}</defs>
  <rect width="32" height="32" rx="9" fill="url(#g)"/>
  <path fill="#fff" d="{text_path(font, "@", 19, 12.5, 16)}"/>
  <path d="M22 16h5.5m-2.6-3L27.9 16l-3 3" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
'''
    (out / "icon.svg").write_text(big)
    (out / "icon-small.svg").write_text(small)
    print("wrote", out / "icon.svg", out / "icon-small.svg")


if __name__ == "__main__":
    main(sys.argv[1])
