"""Inline the affiliation SVGs into index.html (between <!--LOGO:name--> markers).

Why inline: some static hosts serve .svg without Content-Type image/svg+xml,
and browsers refuse to render such files through <img>. Inline SVG renders everywhere. Artwork is unchanged
(see assets/logos/SOURCES.md); ids and classes are prefixed per logo so they cannot collide, and the fixed
width/height are dropped so CSS sizes them. Re-run after editing a logo:  python3 scripts/inline_logos.py
"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
LABEL = {"meta": "Meta", "uc-davis": "UC Davis", "unc": "The University of North Carolina at Chapel Hill",
         "berkeley": "UC Berkeley", "mit": "Massachusetts Institute of Technology", "cmu": "Carnegie Mellon University"}
# Optional display crops (viewBox only, artwork unchanged). None are used: every logo is shown whole.
VIEWBOX = {}
def inline(name):
    s = (root / "assets/logos" / f"{name}.svg").read_text()
    s = re.sub(r"<\?xml[^>]*>\s*", "", s); s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    p = "lg-" + name.replace("-", "") + "-"
    ids = re.findall(r'\bid="([^"]+)"', s)
    for i in ids:
        s = s.replace(f'id="{i}"', f'id="{p}{i}"').replace(f"url(#{i})", f"url(#{p}{i})").replace(f'href="#{i}"', f'href="#{p}{i}"')
    for c in set(re.findall(r"\.(cls-\d+)", s)):
        s = re.sub(rf"\.{c}\b", f".{p}{c}", s); s = re.sub(rf'class="{c}"', f'class="{p}{c}"', s)
    def root_tag(m):
        t = re.sub(r'\s(width|height|class|data-name)="[^"]*"', "", m.group(0))
        if name in VIEWBOX:
            t = re.sub(r'viewBox="[^"]*"', f'viewBox="{VIEWBOX[name]}"', t)
        return t.replace("<svg", f'<svg class="logo logo--{name}" role="img" aria-label="{LABEL[name]}" focusable="false"', 1)
    s = re.sub(r"<svg\b[^>]*>", root_tag, s, count=1)
    return re.sub(r">\s+<", "><", s.strip())
for name in LABEL:
    html, n = re.subn(rf"<!--LOGO:{name}-->.*?<!--/LOGO-->", lambda m: f"<!--LOGO:{name}-->{inline(name)}<!--/LOGO-->", html, flags=re.S)
    assert n == 1, name
(root / "index.html").write_text(html)
print("inlined", len(LABEL), "logos")
