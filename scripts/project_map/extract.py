"""Reads the project's structure straight from the code: database tables, API endpoints, Python classes and functions."""

import ast
import os
import sys
from pathlib import Path


def extract(repo_root: Path) -> dict:
    """Returns tables (from the SQLAlchemy models), endpoints (from FastAPI's OpenAPI spec) and classes/functions (from the source)."""
    backend = repo_root / "backend"
    # Importing the app builds an engine; an in-memory SQLite URL keeps that from touching a real database.
    os.environ["DATABASE_URL"] = "sqlite://"
    sys.path.insert(0, str(backend))
    from app.main import app as fastapi_app  # noqa: PLC0415

    import app.models  # noqa: F401, PLC0415 - registers every table on Base.metadata
    from app.core.database import Base  # noqa: PLC0415

    out: dict = {"tables": [], "endpoints": [], "classes": [], "functions": []}

    for t in Base.metadata.sorted_tables:
        out["tables"].append({
            "name": t.name,
            "columns": [
                {
                    "name": c.name,
                    "type": str(c.type),
                    "pk": c.primary_key,
                    "nullable": c.nullable,
                    "unique": bool(c.unique),
                    "fk": [f"{fk.column.table.name}.{fk.column.name}" for fk in c.foreign_keys],
                }
                for c in t.columns
            ],
        })

    # The OpenAPI spec is the reliable route list: newer FastAPI keeps included routers wrapped in app.routes.
    for path, ops in fastapi_app.openapi()["paths"].items():
        for method, op in ops.items():
            responses = op.get("responses", {})
            status = next(iter(responses), "")
            schema = responses.get(status, {}).get("content", {}).get("application/json", {}).get("schema", {})
            ref = schema.get("$ref") or schema.get("items", {}).get("$ref") or ""
            body = op.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema", {}).get("$ref", "")
            out["endpoints"].append({
                "path": path,
                "method": method.upper(),
                "tags": op.get("tags", []),
                "doc": ((op.get("description") or op.get("summary") or "").strip().splitlines() or [""])[0],
                "status": status,
                "response": ref.split("/")[-1] + ("[]" if schema.get("type") == "array" else ""),
                "body": body.split("/")[-1],
                "auth": bool(op.get("security")),
                "params": [q["name"] for q in op.get("parameters", []) if q.get("in") == "query"],
            })

    for py in sorted((backend / "app").rglob("*.py")):
        rel = py.relative_to(backend).as_posix()
        tree = ast.parse(py.read_text(encoding="utf-8"))
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                out["classes"].append({
                    "file": rel,
                    "name": node.name,
                    "doc": (ast.get_docstring(node) or "").split("\n")[0],
                    "fields": [n.target.id for n in node.body if isinstance(n, ast.AnnAssign) and isinstance(n.target, ast.Name)],
                })
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                out["functions"].append({"file": rel, "name": node.name, "doc": (ast.get_docstring(node) or "").split("\n")[0]})
    return out


def frontend_files(repo_root: Path) -> dict[str, set[str]]:
    """Source files of each frontend feature folder, relative to that folder (used to spot undocumented files)."""
    features = repo_root / "frontend" / "src" / "features"
    return {
        d.name: {p.relative_to(d).as_posix() for p in d.rglob("*") if p.suffix in (".ts", ".tsx")}
        for d in sorted(features.iterdir())
        if d.is_dir()
    }
