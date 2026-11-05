"""Safety checks for lyndahasseler.com. Run: python3 scripts/check_site.py"""
import re, sys
from html.parser import HTMLParser
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "docs"
problems = []

class Balance(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "path", "rect", "circle", "line"}
    def __init__(self):
        super().__init__(); self.stack = []
    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID: self.stack.append((tag, self.getpos()[0]))
    def handle_startendtag(self, tag, attrs): pass
    def handle_endtag(self, tag):
        if tag in self.VOID: return
        if self.stack and self.stack[-1][0] == tag: self.stack.pop(); return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for t, line in self.stack[i + 1:]: problems.append(f"<{t}> opened on line {line} is never closed")
                del self.stack[i:]; return
        problems.append(f"</{tag}> on line {self.getpos()[0]} has no matching opening tag")

for name in ("index.html", "404.html"):
    p = root / name
    if not p.exists(): problems.append(f"docs/{name} is missing"); continue
    html = p.read_text(encoding="utf-8")
    b = Balance(); b.feed(html)
    for t, line in b.stack:
        if t not in ("html", "body", "head", "p", "li"): problems.append(f"{name}: <{t}> opened on line {line} is never closed")
    if re.search(r"<(em|i)[\s>]", html): problems.append(f"{name}: uses italics (<em> or <i>); put titles in quotation marks instead")

index = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
if re.search(r"font-style:\s*italic", css): problems.append("styles.css: uses italics")
if 'name="robots" content="noindex"' in index: problems.append("index.html hides the site from search engines (noindex)")
if (root / "CNAME").read_text().strip() != "www.lyndahasseler.com": problems.append("docs/CNAME was changed; it must be www.lyndahasseler.com")
if "docs.google.com/forms/d/e/1FAIpQLSdmT6eLsomsDcI6EJuw0RDb3Mb268mBrHzUeiJe3V11aaX6ng/formResponse" not in index: problems.append("the stay-in-touch form is no longer connected to its Google Form")
for sid in ("listen", "overview", "welcome", "biography", "highlights", "teaching", "christmas", "tributes", "stay-in-touch"):
    if f'id="{sid}"' not in index: problems.append(f'section id="{sid}" is missing')
v_index = re.search(r"styles\.css\?v=(\d+)", index); v_404 = re.search(r"styles\.css\?v=(\d+)", (root / "404.html").read_text(encoding="utf-8"))
if v_index and v_404 and v_index.group(1) != v_404.group(1): problems.append("styles.css?v= number differs between index.html and 404.html")
for src in re.findall(r'(?:src|srcset)="(assets/[^"]+)"', index):
    if not (root / src).exists(): problems.append(f"image {src} is missing")

if problems:
    print("Problems found:"); [print(" -", x) for x in problems]; sys.exit(1)
print("All checks passed")
