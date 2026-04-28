#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

from bs4 import BeautifulSoup


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/set_form_endpoint.py https://formspree.io/f/xxxxx")
    endpoint = sys.argv[1].strip()
    if not endpoint.startswith("https://"):
        raise SystemExit("Endpoint must start with https://")

    root = Path(__file__).resolve().parents[1]
    html_files = [p for p in root.rglob("*.html") if "/_ref/" not in p.as_posix()]
    touched = 0

    for p in html_files:
        soup = BeautifulSoup(p.read_text(encoding="utf-8"), "lxml")
        head = soup.find("head")
        if not head:
            continue
        meta = head.find("meta", attrs={"name": "form-endpoint"})
        if meta:
            if meta.get("content") != endpoint:
                meta["content"] = endpoint
                touched += 1
        else:
            new_meta = soup.new_tag("meta")
            new_meta["name"] = "form-endpoint"
            new_meta["content"] = endpoint
            head.append(new_meta)
            touched += 1

        p.write_text(str(soup), encoding="utf-8")

    print(f"Updated {touched}/{len(html_files)} HTML files with form-endpoint meta.")


if __name__ == "__main__":
    main()

