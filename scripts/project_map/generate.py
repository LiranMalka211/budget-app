"""Generates docs/project-map.pdf: a Hebrew map of the project's tables, endpoints, classes and files, grouped by domain.

Run with the backend's Python (it imports the FastAPI app to read the real routes and tables):

    backend\\.venv\\Scripts\\python scripts\\project_map\\generate.py          (Windows)
    backend/.venv/bin/python scripts/project_map/generate.py              (macOS / Linux)

Needs Google Chrome, Chromium or Microsoft Edge for printing (set CHROME_PATH if it is not found).
The Hebrew font comes from frontend/node_modules (run `npm install` in frontend/ first); without it a system font is used.
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(HERE))

from extract import extract, frontend_files  # noqa: E402
from render import missing_translations, render_html, unmapped_files  # noqa: E402

FONT_DIR = REPO / "frontend" / "node_modules" / "@fontsource-variable" / "heebo" / "files"

BROWSER_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
]


def find_browser(explicit: str | None) -> str:
    """Locates a Chromium-based browser: --chrome, then CHROME_PATH, then common install paths and PATH."""
    for candidate in (explicit, os.environ.get("CHROME_PATH")):
        if candidate:
            return candidate
    for path in BROWSER_CANDIDATES:
        if Path(path).exists():
            return path
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome", "msedge"):
        found = shutil.which(name)
        if found:
            return found
    sys.exit("No Chrome/Chromium/Edge found. Install one or set CHROME_PATH.")


def print_pdf(browser: str, html_file: Path, pdf_file: Path) -> None:
    """Prints the HTML to PDF with the browser's headless mode; page numbers come from the CSS @page footer."""
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run(
            [
                browser,
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                "--allow-file-access-from-files",
                f"--user-data-dir={profile}",
                # Gives web fonts time to load before printing.
                "--virtual-time-budget=5000",
                f"--print-to-pdf={pdf_file}",
                html_file.as_uri(),
            ],
            check=True,
            capture_output=True,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, default=REPO / "docs" / "project-map.pdf", help="output PDF path")
    parser.add_argument("--html", type=Path, help="also keep the intermediate HTML at this path")
    parser.add_argument("--chrome", help="path to Chrome/Chromium/Edge")
    args = parser.parse_args()

    data = extract(REPO)
    if not FONT_DIR.exists():
        print(f"warning: {FONT_DIR} not found; run `npm install` in frontend/ for the Heebo font.")
    page = render_html(data, FONT_DIR.as_uri())

    html_file = args.html or Path(tempfile.gettempdir()) / "project-map.html"
    html_file.write_text(page, encoding="utf-8")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    print_pdf(find_browser(args.chrome), html_file.resolve(), args.out.resolve())
    if not args.html:
        html_file.unlink(missing_ok=True)

    print(
        f"wrote {args.out}  ({len(data['tables'])} tables, {len(data['endpoints'])} endpoints, "
        f"{len(data['classes'])} classes, {len(data['functions'])} functions)"
    )
    # New code shows up automatically, but its Hebrew explanation has to be added to content_he.py.
    for title, items in (
        ("No Hebrew description yet (add to content_he.py)", missing_translations(data)),
        ("Not assigned to any section (add to DOMAINS / FRONTEND_HE in content_he.py)", unmapped_files(data, frontend_files(REPO))),
    ):
        if items:
            print(f"\n{title}:")
            for item in items:
                print(f"  - {item}")


if __name__ == "__main__":
    main()
