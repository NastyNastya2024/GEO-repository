#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup


def is_relative_url(u: str) -> bool:
    if not u:
        return False
    u = u.strip()
    if u.startswith(("#", "/", "mailto:", "tel:")):
        return False
    parsed = urlparse(u)
    return not parsed.scheme and not parsed.netloc


def needs_root_asset_fix(u: str) -> bool:
    # Fix only references to repo-root assets that are NOT duplicated under /en/
    u = (u or "").strip()
    return (
        u == "styles.css"
        or u.endswith("/styles.css")
        or u == "script.js"
        or u.endswith("/script.js")
        or u.startswith("Img/")
        or u.startswith("../Img/")
    )


def fix_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "lxml")
    changed = False

    # Stylesheets
    for link in soup.find_all("link"):
        href = link.get("href")
        if not isinstance(href, str):
            continue
        if is_relative_url(href) and needs_root_asset_fix(href):
            link["href"] = "../" + href
            changed = True

    # Scripts
    for s in soup.find_all("script"):
        src = s.get("src")
        if not isinstance(src, str):
            continue
        if is_relative_url(src) and needs_root_asset_fix(src):
            s["src"] = "../" + src
            changed = True

    # Media (img/video/source)
    for tag in soup.find_all(["img", "video", "source"]):
        attr = "src"
        src = tag.get(attr)
        if not isinstance(src, str):
            continue
        if is_relative_url(src) and needs_root_asset_fix(src):
            tag[attr] = "../" + src
            changed = True

    if changed:
        path.write_text(str(soup), encoding="utf-8")
    return changed


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    en_root = root / "en"
    if not en_root.exists():
        raise SystemExit("en/ folder not found. Run generate_en.py first.")

    files = list(en_root.rglob("*.html"))
    touched = 0
    for f in files:
        if fix_file(f):
            touched += 1
    print(f"Fixed asset paths in {touched}/{len(files)} files")


if __name__ == "__main__":
    main()

