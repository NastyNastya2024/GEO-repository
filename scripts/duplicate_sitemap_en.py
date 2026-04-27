#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import xml.etree.ElementTree as ET


def main() -> None:
  root_dir = Path(__file__).resolve().parents[1]
  sitemap_path = root_dir / "sitemap.xml"
  tree = ET.parse(sitemap_path)
  urlset = tree.getroot()

  ns = ""
  if urlset.tag.startswith("{"):
    ns = urlset.tag.split("}")[0].strip("{")

  def q(tag: str) -> str:
    return f"{{{ns}}}{tag}" if ns else tag

  urls = list(urlset.findall(q("url")))
  existing_locs = set()
  for u in urls:
    loc_el = u.find(q("loc"))
    if loc_el is not None and loc_el.text:
      existing_locs.add(loc_el.text.strip())

  to_add = []
  for u in urls:
    loc_el = u.find(q("loc"))
    if loc_el is None or not loc_el.text:
      continue
    loc = loc_el.text.strip()
    if "/en/" in loc:
      continue
    # Keep https://example.com/ prefix style as-is
    if loc.endswith("https://example.com/") or loc == "https://example.com/":
      en_loc = "https://example.com/en/"
    else:
      en_loc = loc.replace("https://example.com/", "https://example.com/en/", 1)
    if en_loc in existing_locs:
      continue

    clone = ET.fromstring(ET.tostring(u, encoding="unicode"))
    clone_loc_el = clone.find(q("loc"))
    if clone_loc_el is not None:
      clone_loc_el.text = en_loc
    to_add.append(clone)
    existing_locs.add(en_loc)

  for u in to_add:
    urlset.append(u)

  tree.write(sitemap_path, encoding="utf-8", xml_declaration=True)
  print(f"Added {len(to_add)} /en/ URLs to sitemap.xml")


if __name__ == "__main__":
  main()

