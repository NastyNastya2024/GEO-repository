#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Iterable

from bs4 import BeautifulSoup, NavigableString
from deep_translator import GoogleTranslator, MyMemoryTranslator


RE_CYR = re.compile(r"[А-Яа-яЁё]")
RE_WS = re.compile(r"\s+")

SKIP_TAGS = {
    "script",
    "style",
    "noscript",
    "svg",
    "path",
    "code",
    "pre",
}

TRANSLATABLE_ATTRS = {
    "aria-label",
    "title",
    "placeholder",
    "alt",
}


def collapse_ws(s: str) -> str:
    return RE_WS.sub(" ", s).strip()


def should_translate_text(text: str) -> bool:
    t = collapse_ws(text)
    if not t:
        return False
    if len(t) < 2:
        return False
    if not RE_CYR.search(t):
        return False
    # Avoid translating short slugs/ids-like fragments
    if len(t) <= 3 and t.isupper():
        return False
    return True


def translate_chunked(translator, text: str, limit: int = 4500) -> str:
    t = text
    if len(t) <= limit:
        return translator.translate(t)

    parts: list[str] = []
    start = 0
    while start < len(t):
        end = min(len(t), start + limit)
        # try to split on sentence end / newline
        cut = max(
            t.rfind("\n", start, end),
            t.rfind(". ", start, end),
            t.rfind("! ", start, end),
            t.rfind("? ", start, end),
        )
        if cut <= start + 200:  # too close, just hard cut
            cut = end
        part = t[start:cut]
        parts.append(translator.translate(part))
        start = cut
    return "".join(parts)


def iter_html_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*.html"):
        rel = p.relative_to(root).as_posix()
        if rel.startswith("en/"):
            continue
        if "/_ref/" in rel or rel.startswith("_ref/"):
            continue
        yield p


def cache_translate(translator, cache: dict[str, str], ru: str) -> str:
    key = collapse_ws(ru)
    if not should_translate_text(key):
        return ru
    if key in cache:
        return cache[key]

    time.sleep(0.08)

    last_err: Exception | None = None
    for attempt in range(4):
        try:
            en = translate_chunked(translator, key)
            en_out = en if ru == key else ru.replace(key, en)
            cache[key] = en_out
            return en_out
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(0.6 * (attempt + 1))

    if last_err:
        raise last_err
    return ru


def translate_html_file(translator, src: Path, dst: Path, cache: dict[str, str]) -> None:
    html = src.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "lxml")

    if soup.html and soup.html.has_attr("lang"):
        soup.html["lang"] = "en"

    # title
    if soup.title and soup.title.string and should_translate_text(soup.title.string):
        soup.title.string.replace_with(cache_translate(translator, cache, str(soup.title.string)))

    # meta: description / keywords / og:*
    for meta in soup.find_all("meta"):
        name = (meta.get("name") or "").lower().strip()
        prop = (meta.get("property") or "").lower().strip()
        if name in {"description", "keywords"} and meta.get("content") and should_translate_text(meta["content"]):
            meta["content"] = cache_translate(translator, cache, meta["content"])
        if prop in {"og:title", "og:description"} and meta.get("content") and should_translate_text(meta["content"]):
            meta["content"] = cache_translate(translator, cache, meta["content"])
        if prop == "og:locale":
            meta["content"] = "en_US"

    # canonical: prefix /en/ (keep relative style used in repo)
    canon = soup.find("link", attrs={"rel": "canonical"})
    if canon and canon.get("href"):
        href = canon["href"].strip()
        if href.startswith("/") and not href.startswith("/en/"):
            canon["href"] = "/en" + href

    # translate attributes
    for tag in soup.find_all(True):
        if tag.name in SKIP_TAGS:
            continue
        for attr in TRANSLATABLE_ATTRS:
            if tag.has_attr(attr):
                val = str(tag.get(attr) or "")
                if should_translate_text(val):
                    tag[attr] = cache_translate(translator, cache, val)

    # translate text nodes
    for node in list(soup.descendants):
        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if not parent or getattr(parent, "name", None) in SKIP_TAGS:
            continue
        txt = str(node)
        if not should_translate_text(txt):
            continue

        leading = txt[: len(txt) - len(txt.lstrip("\n\r\t "))]
        trailing = txt[len(txt.rstrip("\n\r\t ")) :]
        core = txt.strip("\n\r\t ")
        try:
            translated = cache_translate(translator, cache, core)
        except Exception:
            # If a single node fails, keep original text so generation completes
            continue
        node.replace_with(leading + translated + trailing)

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(str(soup), encoding="utf-8")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_root = root / "en"
    out_root.mkdir(parents=True, exist_ok=True)

    cache_path = root / "scripts" / ".translate-cache.ru-en.json"
    if cache_path.exists():
        try:
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            cache = {}
        if not isinstance(cache, dict):
            cache = {}
    else:
        cache = {}

    translator = MyMemoryTranslator(source="ru-RU", target="en-US")
    google_fallback = GoogleTranslator(source="ru", target="en")

    files = sorted(iter_html_files(root))
    total = len(files)
    done = 0
    for src in files:
        rel = src.relative_to(root)
        dst = out_root / rel
        if dst.exists() and dst.stat().st_size > 400:
            done += 1
            continue
        try:
            translate_html_file(translator, src, dst, cache)
        except Exception:
            translate_html_file(google_fallback, src, dst, cache)
        done += 1
        if done % 3 == 0:
            cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"[{done}/{total}] {rel}", flush=True)

    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {done} EN pages under: {out_root}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)

