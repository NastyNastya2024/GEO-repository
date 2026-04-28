#!/usr/bin/env python3
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def bump(text: str, version: str) -> str:
    def repl_css(m: re.Match[str]) -> str:
        before = m.group(1)
        href = m.group(2)
        after = m.group(3)
        href = re.sub(r"\?v=\d{10,14}$", "", href)
        joiner = "&" if "?" in href else "?"
        return f'{before}{href}{joiner}v={version}{after}'

    def repl_js(m: re.Match[str]) -> str:
        before = m.group(1)
        src = m.group(2)
        after = m.group(3)
        src = re.sub(r"\?v=\d{10,14}$", "", src)
        joiner = "&" if "?" in src else "?"
        return f'{before}{src}{joiner}v={version}{after}'

    # <link ... href="...styles.css[?v=...]"...>
    text = re.sub(
        r'(<link\b[^>]*\bhref=")([^"]*styles\.css(?:\?v=\d{10,14})?)("[^>]*>)',
        repl_css,
        text,
        flags=re.IGNORECASE,
    )
    # <script ... src="...script.js[?v=...]"...></script>
    text = re.sub(
        r'(<script\b[^>]*\bsrc=")([^"]*script\.js(?:\?v=\d{10,14})?)("[^>]*>\s*</script>)',
        repl_js,
        text,
        flags=re.IGNORECASE,
    )
    return text


def main() -> None:
    version = datetime.now().strftime("%Y%m%d%H%M")
    html_files = sorted(
        [p for p in ROOT.rglob("*.html") if "node_modules" not in p.parts and ".git" not in p.parts]
    )
    changed = 0
    for path in html_files:
        before = path.read_text(encoding="utf-8", errors="ignore")
        after = bump(before, version)
        if after != before:
            path.write_text(after, encoding="utf-8")
            changed += 1
    print(f"Updated {changed} HTML files with v={version}")


if __name__ == "__main__":
    main()

