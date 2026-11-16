#!/usr/bin/env python3
"""Build the Barkeys icons.

All glyphs (@, b, arrow) are drawn as geometric monoline strokes with one
shared stroke width and round caps, so they match in height and weight.

Usage: python3 build-icons.py
Writes ../icons/icon.svg (48 px and up) and ../icons/icon-small.svg (16/32 px).
"""
import math
from pathlib import Path

INK = "#181721"
DEEP, MID = "#a7003b", "#d60042"
GRAD = f'''<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{DEEP}"/><stop offset=".6" stop-color="{MID}"/></linearGradient>'''


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def at_sign(cx, cy, R, r, end_deg):
    """Monoline @: inner bowl + stem, hook into the outer ring.

    The ring runs counter-clockwise (visually) from 3 o'clock over the top
    and ends at `end_deg` (SVG angle, 90 = 6 o'clock). Returns
    (path_d, end_point, end_direction).
    """
    k = (R - r) / 2
    a = math.radians(end_deg)
    ex, ey = cx + R * math.cos(a), cy + R * math.sin(a)
    sweep_span = 360 - end_deg
    d = (
        f"M{f(cx + r)} {f(cy - r)}V{f(cy)}"
        f"A{f(k)} {f(k)} 0 0 0 {f(cx + R)} {f(cy)}"
        f"A{f(R)} {f(R)} 0 {1 if sweep_span > 180 else 0} 0 {f(ex)} {f(ey)}"
    )
    # Tangent of a counter-clockwise (visual) circle in SVG coordinates.
    direction = (math.sin(a), -math.cos(a))
    return d, (ex, ey), direction


def circle(cx, cy, r):
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 0 {f(2 * r)} 0a{f(r)} {f(r)} 0 1 0 {f(-2 * r)} 0"


def letter_b(x, top, bottom, bowl_r):
    """Geometric b: stem from top to bottom, round bowl sitting on the baseline."""
    bcx, bcy = x + bowl_r, bottom - bowl_r
    return f"M{f(x)} {f(top)}V{f(bottom)}" + circle(bcx, bcy, bowl_r)


def arrow(x1, x2, y, head):
    return (f"M{f(x1)} {f(y)}H{f(x2)}"
            f"M{f(x2 - head)} {f(y - head)}L{f(x2)} {f(y)}L{f(x2 - head)} {f(y + head)}")


def stroke(d, color, w):
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{f(w)}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>')


def big_icon():
    w = 3.2                    # one stroke width for @, b and arrow
    R, r = 8.6, 3.3            # @ outer / inner radius (centre line)
    cy = 48
    top, bottom = cy - R, cy + R
    at_cx = 27.2
    at_d, _, _ = at_sign(at_cx, cy, R, r, 82)
    inner = circle(at_cx, cy, r)
    b_x = at_cx + R + w + 3.2
    b_d = letter_b(b_x, top, bottom, 5.6)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>{GRAD}</defs>
  <rect x="4" y="4" width="88" height="88" rx="26" fill="url(#g)"/>
  <rect x="9" y="28" width="78" height="40" rx="20" fill="#fff"/>
  <rect x="14" y="33" width="44" height="30" rx="15" fill="{INK}"/>
  {stroke(inner + at_d, "#fff", w)}
  {stroke(b_d, "#fff", w)}
  {stroke(arrow(65, 79, cy, 5.2), MID, w)}
</svg>
'''


def small_icon():
    w = 2.5
    R, r = 6.8, 2.7
    cx, cy = 11.5, 14.5
    at_d, (ex, ey), (dx, dy) = at_sign(cx, cy, R, r, 68)
    line_y = 21.0
    x_end = 28.5
    # Tail: leave the ring tangentially, ease into a horizontal arrow shaft.
    c1 = (ex + dx * 2.6, ey + dy * 2.6)
    c2 = (ex + 6.5, line_y)
    tail = (f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(ex + 8.5)} {f(line_y)}"
            f"H{f(x_end)}"
            f"M{f(x_end - 3.6)} {f(line_y - 3.6)}L{f(x_end)} {f(line_y)}L{f(x_end - 3.6)} {f(line_y + 3.6)}")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>{GRAD}</defs>
  <rect width="32" height="32" rx="9" fill="url(#g)"/>
  {stroke(circle(cx, cy, r) + at_d + tail, "#fff", w)}
</svg>
'''


def main():
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    (out / "icon.svg").write_text(big_icon())
    (out / "icon-small.svg").write_text(small_icon())
    print("wrote", out / "icon.svg", out / "icon-small.svg")


if __name__ == "__main__":
    main()
