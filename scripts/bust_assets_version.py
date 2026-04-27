#!/usr/bin/env python3
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")

    # Replace script.js and styles.css references with cache-busted ones.
    # Keep existing query string if present (overwrite v=...).
    patterns = [
        (re.compile(r'(<script[^>]+src="[^"]*script\.js)(\?[^"]*)?(")', re.I), r"\1?v=" + version + r"\3"),
        (re.compile(r'(<link[^>]+href="[^"]*styles\.css)(\?[^"]*)?(")', re.I), r"\1?v=" + version + r"\3"),
    ]

    html_files = [p for p in root.rglob("*.html") if "/_ref/" not in p.as_posix()]
    touched = 0
    for p in html_files:
        s = p.read_text(encoding="utf-8")
        out = s
        for rx, repl in patterns:
            out = rx.sub(repl, out)
        if out != s:
            p.write_text(out, encoding="utf-8")
            touched += 1

    print(f"Version={version}. Updated {touched}/{len(html_files)} HTML files.")


if __name__ == "__main__":
    main()

