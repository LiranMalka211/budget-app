# Project map generator

Builds [`docs/project-map.pdf`](../../docs/project-map.pdf): a Hebrew overview of the project's database tables, API endpoints, classes, service functions and frontend files, grouped by domain (auth, family, transactions, ...).

The structure is read from the code on every run. Tables come from the SQLAlchemy models, endpoints from FastAPI's OpenAPI spec, and classes and functions from the backend source. Only the Hebrew explanations are written by hand, in [`content_he.py`](content_he.py).

## Run

Use the backend's Python, because the script imports the FastAPI app:

```bash
backend\.venv\Scripts\python scripts\project_map\generate.py    # Windows
backend/.venv/bin/python scripts/project_map/generate.py        # macOS / Linux
```

Options: `--out <file.pdf>`, `--html <file.html>` (also keep the HTML), and `--chrome <path>`.

Requirements:
- **Chrome, Chromium or Edge** for printing. The script finds it automatically; set `CHROME_PATH` if it doesn't.
- **Hebrew font:** `npm install` in `frontend/` provides the Heebo font. Without it the PDF uses a system font.

## After changing the code

New tables, endpoints, classes and functions appear in the PDF automatically. When something has no Hebrew description yet, or a file belongs to no section, the script lists it after generating. Add it in `content_he.py`:

| What you added | Where in `content_he.py` |
|---|---|
| Table / column | `TABLE_HE`, `COLUMN_HE` |
| Endpoint | `ENDPOINT_HE` |
| Class | `CLASS_HE` |
| Function | `FUNC_HE` (or `FUNC_FILE_HE` when the name exists in two files) |
| New backend file | the `files` list of its section in `DOMAINS` |
| Frontend file | `FRONTEND_HE[<feature folder>]` |

| File | Role |
|---|---|
| `generate.py` | Entry point: extract, render, print to PDF, report gaps |
| `extract.py` | Reads tables, endpoints, classes and functions from the code |
| `render.py` | Builds the right-to-left HTML |
| `content_he.py` | Hebrew descriptions and the section layout |
