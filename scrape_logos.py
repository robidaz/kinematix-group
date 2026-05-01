"""
scrape_logos.py
---------------
Parse a local export of the Dynamix partners page (saved as
`dynamix_partners.html` at the project root), download each partner logo
referenced in the page, and write the images to `src/assets/logos/`.

Filenames are normalized: company name (or `alt` text, falling back to the
URL basename) is lowercased and non-alphanumeric runs are replaced with
hyphens. For example: "Palo Alto Networks" -> palo-alto-networks.png.

Run manually before building or deploying:

    pip install -r requirements.txt
    python scrape_logos.py
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

PROJECT_ROOT = Path(__file__).resolve().parent
SOURCE_HTML = PROJECT_ROOT / "dynamix_partners.html"
OUTPUT_DIR = PROJECT_ROOT / "src" / "assets" / "logos"
LOGO_SELECTOR = "img.company-logo"
TIMEOUT_SECONDS = 20

USER_AGENT = (
    "Mozilla/5.0 (compatible; VendorVaultLogoScraper/1.0; "
    "+https://kinematixgroup.example)"
)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def derive_filename(img_tag, src_url: str) -> str:
    candidate = img_tag.get("alt") or img_tag.get("title") or ""
    if not candidate.strip():
        # fall back to URL basename without extension
        parsed = urlparse(src_url)
        base = os.path.basename(parsed.path)
        candidate = os.path.splitext(base)[0]
    slug = slugify(candidate) or "vendor"
    # always normalize to .png on disk regardless of original extension
    return f"{slug}.png"


def main() -> int:
    if not SOURCE_HTML.exists():
        print(
            f"ERROR: {SOURCE_HTML} not found. "
            "Save the Dynamix partners page HTML to that location and re-run.",
            file=sys.stderr,
        )
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    html = SOURCE_HTML.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")

    images = soup.select(LOGO_SELECTOR)
    if not images:
        # broader fallback: any <img> with a src
        images = [img for img in soup.find_all("img") if img.get("src")]

    print(f"Found {len(images)} candidate logo image(s) in {SOURCE_HTML.name}.")

    downloaded = 0
    skipped = 0
    failed = 0
    seen_filenames: set[str] = set()

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    for img in images:
        src = img.get("src")
        if not src or src.startswith("data:"):
            continue

        # resolve protocol-relative URLs
        if src.startswith("//"):
            src = "https:" + src

        filename = derive_filename(img, src)
        out_path = OUTPUT_DIR / filename

        if filename in seen_filenames or out_path.exists():
            skipped += 1
            continue
        seen_filenames.add(filename)

        try:
            resp = session.get(src, timeout=TIMEOUT_SECONDS)
            resp.raise_for_status()
        except Exception as exc:  # noqa: BLE001
            print(f"  ! FAILED  {src} -> {filename}: {exc}")
            failed += 1
            continue

        out_path.write_bytes(resp.content)
        downloaded += 1
        print(f"  + {filename}  ({len(resp.content):,} bytes)")

    print()
    print(f"Downloaded: {downloaded}")
    print(f"Skipped (duplicate / already present): {skipped}")
    print(f"Failed: {failed}")
    print(f"Output directory: {OUTPUT_DIR}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
