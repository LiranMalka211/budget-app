"""Renders the project map as a right-to-left Hebrew HTML document (printed to PDF by generate.py)."""

import html
from datetime import date

from content_he import (
    CLASS_HE,
    COLUMN_HE,
    DOMAINS,
    ENDPOINT_HE,
    ENDPOINT_RESPONSE_FIX,
    FRONTEND_HE,
    FUNC_FILE_HE,
    FUNC_HE,
    TABLE_HE,
)

E = html.escape


def code(s: str) -> str:
    """Inline code span, isolated as left-to-right inside the Hebrew text."""
    return f'<code dir="ltr">{E(s)}</code>'


def render_html(data: dict, font_uri: str) -> str:
    """Builds the full HTML document from the extracted data; `font_uri` is a file:// folder with the Heebo woff2 files."""
    tables = {t["name"]: t for t in data["tables"]}
    classes_by_file: dict[str, list] = {}
    for c in data["classes"]:
        classes_by_file.setdefault(c["file"], []).append(c)
    funcs_by_file: dict[str, list] = {}
    for f in data["functions"]:
        funcs_by_file.setdefault(f["file"], []).append(f)


    def kind_of(file: str) -> str:
        part = file.split("/")[1]
        return {"models": "מודל ORM", "schemas": "סכמה (Pydantic)", "core": "תשתית", "services": "שירות"}.get(part, "")


    def table_html(name: str) -> str:
        t = tables[name]
        rows = []
        for c in t["columns"]:
            keys = []
            if c["pk"]:
                keys.append('<span class="tag pk">PK</span>')
            for fk in c["fk"]:
                keys.append(f'<span class="tag fk">FK {code(fk)}</span>')
            if c["unique"]:
                keys.append('<span class="tag">ייחודי</span>')
            nullable = "" if (c["nullable"] is False or c["pk"]) else '<span class="muted">רשות</span>'
            rows.append(
                f"<tr><td>{code(c['name'])}</td><td>{code(c['type'])}</td><td>{' '.join(keys)} {nullable}</td>"
                f"<td>{E(COLUMN_HE.get(name + '.' + c['name'], ''))}</td></tr>"
            )
        return (
            f'<div class="table-block"><h4>{code(name)}</h4><p class="desc">{E(TABLE_HE[name])}</p>'
            '<table class="grid"><thead><tr><th>עמודה</th><th>סוג</th><th>מפתחות</th><th>הערות</th></tr></thead>'
            f"<tbody>{''.join(rows)}</tbody></table></div>"
        )


    def endpoints_html(tags: list[str]) -> str:
        eps = [e for e in data["endpoints"] if set(e["tags"]) & set(tags)]
        if not eps:
            return ""
        rows = []
        for e in eps:
            key = f"{e['method']} {e['path']}"
            resp = ENDPOINT_RESPONSE_FIX.get(key) or e["response"].replace("Paged_TransactionOut_", "Paged[TransactionOut]") or "—"
            if e["status"] == "204":
                resp = "ללא תוכן"
            params = " ".join(code(p) for p in e["params"])
            body = code(e["body"]) if e["body"] else ""
            inp = " ".join(x for x in (body, f'<span class="muted">query:</span> {params}' if params else "") if x) or "—"
            lock = '<span class="lock" title="דורש התחברות">🔒</span>' if e["auth"] else ""
            rows.append(
                f'<tr><td><span class="method m-{e["method"].lower()}">{e["method"]}</span></td>'
                f'<td><code dir="ltr" class="path">{E(e["path"]).replace("/", "/<wbr>")}</code> {lock}</td><td>{E(ENDPOINT_HE.get(key, e["doc"]))}</td>'
                f'<td><div class="io"><span class="io-l">קלט</span><span>{inp}</span></div>'
                f'<div class="io"><span class="io-l">תשובה</span><span>{code(resp) if resp not in ("—", "ללא תוכן") else resp} '
                f'<span class="muted">· {e["status"]}</span></span></div></td></tr>'
            )
        return (
            '<h3>נקודות קצה (Endpoints)</h3><table class="grid endpoints"><colgroup><col style="width:9%"><col style="width:30%">'
            '<col style="width:25%"><col style="width:36%"></colgroup><thead><tr><th>שיטה</th><th>נתיב</th>'
            "<th>מה זה עושה</th><th>קלט ותשובה</th></tr></thead>"
            f"<tbody>{''.join(rows)}</tbody></table>"
        )


    def classes_html(files: list[str]) -> str:
        rows = []
        for f in files:
            for c in classes_by_file.get(f, []):
                fields = ", ".join(c["fields"][:8]) + (" …" if len(c["fields"]) > 8 else "")
                rows.append(
                    f"<tr><td>{code(c['name'])}<div class=\"file\" dir=\"ltr\">{E(f)}</div></td><td>{E(kind_of(f))}</td>"
                    f"<td>{E(CLASS_HE.get(c['name'], c['doc']))}</td>"
                    f'<td class="small">{code(fields) if fields else ""}</td></tr>'
                )
        if not rows:
            return ""
        return (
            '<h3>מחלקות</h3><table class="grid classes"><colgroup><col style="width:30%"><col style="width:13%"><col style="width:30%">'
            '<col style="width:27%"></colgroup><thead><tr><th>מחלקה</th><th>סוג</th><th>תפקיד</th><th>שדות</th>'
            f"</tr></thead><tbody>{''.join(rows)}</tbody></table>"
        )


    def functions_html(files: list[str]) -> str:
        groups = []
        for f in files:
            fs = funcs_by_file.get(f, [])
            if not fs or f.startswith("app/api/"):
                continue  # route handlers are already covered by the endpoints table
            items = "".join(
                f"<li>{code(fn['name'] + '()')} – {E(FUNC_FILE_HE.get((f, fn['name'])) or FUNC_HE.get(fn['name'], fn['doc']))}</li>"
                for fn in fs
            )
            groups.append(f'<div class="fn-group"><div class="fn-file">{code(f)}</div><ul>{items}</ul></div>')
        if not groups:
            return ""
        return f'<h3>פונקציות שירות ולוגיקה</h3><div class="fn-groups">{"".join(groups)}</div>'


    def frontend_html(features: str | list[str] | None) -> str:
        """One table of frontend files per feature folder the section uses."""
        if not features:
            return ""
        out = []
        for feature in [features] if isinstance(features, str) else features:
            items = "".join(
                f"<tr><td>{code(path)}</td><td>{E(desc)}</td></tr>" for path, desc in FRONTEND_HE[feature].items()
            )
            out.append(
                f'<h3>צד לקוח (React) – {code("frontend/src/features/" + feature + "/")}</h3>'
                f'<table class="grid"><thead><tr><th>קובץ</th><th>תפקיד</th></tr></thead><tbody>{items}</tbody></table>'
            )
        return "".join(out)


    def domain_html(d: dict, n: int) -> str:
        parts = [
            f'<section class="domain" id="{d["id"]}"><h2><span class="num">{n}</span> {E(d["title"])}</h2>',
            f'<p class="intro">{E(d["intro"])}</p>',
        ]
        if d["tables"]:
            parts.append("<h3>טבלאות במסד הנתונים</h3>" + "".join(table_html(t) for t in d["tables"]))
        parts += [endpoints_html(d["tags"]), classes_html(d["files"]), functions_html(d["files"]), frontend_html(d["frontend"])]
        parts.append("</section>")
        return "".join(parts)


    # ---------------------------------------------------------------- relationships (from foreign keys)

    rels = []
    for t in data["tables"]:
        for c in t["columns"]:
            for fk in c["fk"]:
                rels.append((t["name"], c["name"], fk))
    rel_rows = "".join(
        f"<tr><td>{code(src)}</td><td>{code(col)}</td><td>←</td><td>{code(fk)}</td></tr>" for src, col, fk in rels
    )

    counts = {
        "טבלאות": len(data["tables"]),
        "נקודות קצה": len(data["endpoints"]),
        "מחלקות": len(data["classes"]),
        "פונקציות": len(data["functions"]),
    }
    toc = "".join(f'<li><a href="#{d["id"]}">{E(d["title"])}</a></li>' for d in DOMAINS)
    stat_tiles = "".join(f'<div class="stat"><b>{v}</b><span>{k}</span></div>' for k, v in counts.items())

    css = f"""
    @font-face {{ font-family: Heebo; src: url('{font_uri}/heebo-hebrew-wght-normal.woff2') format('woff2'); font-weight: 100 900; unicode-range: U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F; }}
    @font-face {{ font-family: Heebo; src: url('{font_uri}/heebo-latin-wght-normal.woff2') format('woff2'); font-weight: 100 900; }}
    @page {{ size: A4; margin: 16mm 14mm 18mm 14mm; @bottom-center {{ content: "מפת הפרויקט – תקציב משפחתי · " counter(page) " / " counter(pages); font-family: Heebo, 'Segoe UI', sans-serif; font-size: 7pt; color: #888; }} }}
    :root {{ --ink:#1c1f2e; --muted:#5d6275; --line:#e1e3ec; --brand:#4b45c6; --brand-soft:#efeefc; --zebra:#f8f8fc; }}
    * {{ box-sizing: border-box; }}
    body {{ font-family: Heebo, 'Segoe UI', Arial, sans-serif; color: var(--ink); font-size: 10pt; line-height: 1.55; margin: 0; background: #fff; }}
    code {{ font-family: Consolas, 'Cascadia Mono', monospace; font-size: 8.6pt; background: #f2f3f8; border-radius: 4px; padding: 0 4px; unicode-bidi: isolate; white-space: nowrap; }}
    td.small code {{ white-space: normal; word-break: break-word; }}
    h1 {{ font-size: 28pt; margin: 0 0 4mm; letter-spacing: -0.5px; }}
    h2 {{ font-size: 17pt; margin: 0 0 2mm; padding-bottom: 2mm; border-bottom: 2px solid var(--brand); display: flex; align-items: center; gap: 3mm; }}
    h2 .num {{ background: var(--brand); color: #fff; border-radius: 6px; font-size: 11pt; min-width: 8mm; height: 8mm; display: inline-flex; align-items: center; justify-content: center; }}
    h3 {{ font-size: 11.5pt; color: var(--brand); margin: 6mm 0 2mm; break-after: avoid; }}
    h4 {{ font-size: 10.5pt; margin: 3mm 0 1mm; break-after: avoid; }}
    .intro {{ color: var(--muted); margin: 0 0 2mm; }}
    .desc {{ margin: 0 0 1.5mm; color: var(--muted); font-size: 9pt; }}
    .muted {{ color: var(--muted); font-size: 8.5pt; }}
    table.grid {{ width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 2mm; }}
    table.grid th {{ background: var(--brand-soft); color: #2d2a7a; font-weight: 600; text-align: start; padding: 1.6mm 2mm; border-bottom: 1px solid var(--line); }}
    table.grid td {{ padding: 1.4mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; }}
    table.grid tbody tr:nth-child(even) td {{ background: var(--zebra); }}
    table.grid tr {{ break-inside: avoid; }}
    .table-block {{ break-inside: avoid; }}
    .tag {{ display: inline-block; font-size: 7.5pt; border: 1px solid var(--line); border-radius: 999px; padding: 0 2mm; margin: 0.3mm 0; background: #fff; }}
    .tag.pk {{ background: #fff4d6; border-color: #f0d68a; }}
    .tag.fk {{ background: #e8f1fd; border-color: #b9d3f5; }}
    .method {{ font-family: Consolas, monospace; font-size: 7.8pt; font-weight: 700; padding: 0.4mm 1.6mm; border-radius: 4px; color: #fff; }}
    .m-get {{ background: #2a78d6; }} .m-post {{ background: #1a9a6c; }} .m-put {{ background: #c98500; }} .m-delete {{ background: #d64545; }}
    .lock {{ font-size: 8pt; }}
    table.endpoints, table.classes {{ table-layout: fixed; }}
    code.path {{ white-space: normal; overflow-wrap: normal; word-break: keep-all; }}
    .io {{ display: grid; grid-template-columns: 11mm 1fr; align-items: baseline; margin: 0.4mm 0; }} .io-l {{ color: var(--muted); font-size: 8pt; }} .io code {{ white-space: nowrap; }} .io .muted {{ white-space: nowrap; }}
    table.classes td:first-child code {{ white-space: normal; overflow-wrap: anywhere; }}
    .file {{ font-family: Consolas, monospace; font-size: 7.4pt; color: var(--muted); margin-top: 0.6mm; text-align: start; overflow-wrap: anywhere; }}
    .fn-groups {{ columns: 1; }}
    .fn-group {{ break-inside: avoid; margin-bottom: 2.5mm; }}
    .fn-file {{ font-weight: 600; margin-bottom: 0.5mm; }}
    .fn-group ul {{ margin: 0; padding-inline-start: 5mm; }}
    .fn-group li {{ margin: 0.3mm 0; }}
    section.domain {{ break-before: page; }}
    .cover {{ min-height: 245mm; display: flex; flex-direction: column; }}
    .cover .brand {{ display: inline-flex; align-items: center; gap: 3mm; font-weight: 700; color: var(--brand); font-size: 12pt; margin-bottom: 18mm; }}
    .cover .brand i {{ width: 10mm; height: 10mm; border-radius: 3mm; background: var(--brand); display: inline-block; }}
    .cover .lead {{ font-size: 12pt; color: var(--muted); max-width: 150mm; }}
    .stats {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; margin: 12mm 0 10mm; }}
    .stat {{ border: 1px solid var(--line); border-radius: 4mm; padding: 4mm; background: var(--zebra); }}
    .stat b {{ display: block; font-size: 22pt; color: var(--brand); line-height: 1.1; }}
    .stat span {{ color: var(--muted); }}
    .toc ol {{ padding-inline-start: 6mm; columns: 2; }}
    .toc li {{ margin: 1mm 0; }}
    .toc a {{ color: var(--ink); text-decoration: none; }}
    .arch {{ display: grid; grid-template-columns: 1fr; gap: 2.5mm; margin: 4mm 0; }}
    .layer {{ border: 1px solid var(--line); border-radius: 3mm; padding: 2.5mm 4mm; display: grid; grid-template-columns: 42mm 1fr; gap: 4mm; align-items: center; break-inside: avoid; }}
    .layer b {{ color: var(--brand); }}
    .arrow {{ text-align: center; color: var(--muted); line-height: 1; }}
    .note {{ background: var(--brand-soft); border-radius: 3mm; padding: 3mm 4mm; margin: 3mm 0; }}
    """

    arch = """
    <div class="arch">
      <div class="layer"><b>דפדפן (React)</b><span>דפים לפי תחום ב־<code dir="ltr">frontend/src/features/</code>. ממשק ה־API מוגדר ב־<code dir="ltr">lib/api/contract.ts</code> ויש לו שני מימושים: HTTP אמיתי, ומצב דמו בדפדפן (<code dir="ltr">VITE_USE_MOCK</code>).</span></div>
      <div class="arrow">▼ &nbsp;<code dir="ltr">/api/*</code></div>
      <div class="layer"><b>שרת אינטרנט (nginx)</b><span>קונטיינר frontend: מגיש את קבצי האתר ומעביר כל בקשת <code dir="ltr">/api</code> לשרת. פורט 8080.</span></div>
      <div class="arrow">▼</div>
      <div class="layer"><b>נתבים (FastAPI)</b><span><code dir="ltr">app/api/*.py</code>: נתב דק לכל תחום, מאמת קלט עם סכמות Pydantic ומזהה את המשתמש מה־JWT.</span></div>
      <div class="arrow">▼</div>
      <div class="layer"><b>שירותים</b><span><code dir="ltr">app/services/*.py</code>: כל הלוגיקה העסקית (הרשאות משפחה, תשלומים קבועים, ייבוא, תובנות).</span></div>
      <div class="arrow">▼</div>
      <div class="layer"><b>מודלים (SQLAlchemy)</b><span><code dir="ltr">app/models/*.py</code>: מחלקה לכל טבלה.</span></div>
      <div class="arrow">▼</div>
      <div class="layer"><b>מסד נתונים (PostgreSQL 17)</b><span>קונטיינר database. הטבלאות נוצרות אוטומטית בעליית השרת; ל־Alembic יש מיגרציה ראשונית.</span></div>
    </div>
    """

    docker_rows = "".join(
        f"<tr><td>{code(f)}</td><td>{E(d)}</td></tr>"
        for f, d in [
            ("docker-compose.yml", "מחבר את שלושת השירותים: database → backend → frontend"),
            ("database/Dockerfile", "PostgreSQL 17 עם בדיקת מוכנות; סקריפטים ב-database/init רצים פעם אחת"),
            ("backend/Dockerfile", "Python 3.12, משתמש לא-root, uvicorn בפורט 8000"),
            ("frontend/Dockerfile", "בנייה עם Node 22 והגשה עם nginx"),
            ("frontend/nginx.conf", "העברת /api לשרת, ניתוב SPA ושמירת קבצים במטמון"),
            (".env.example", "משתני הסביבה ש-compose קורא (סיסמת מסד, SECRET_KEY וכו')"),
        ]
    )

    body = f"""
    <div class="cover">
      <div class="brand"><i></i> תקציב משפחתי</div>
      <h1>מפת הפרויקט</h1>
      <p class="lead">כל הטבלאות, נקודות הקצה, המחלקות והקבצים בפרויקט, מסודרים לפי תחום. הנתונים נשלפו ישירות מהקוד ב־{date.today().strftime('%d.%m.%Y')}.</p>
      <div class="stats">{stat_tiles}</div>
      <div class="toc"><h3>תוכן העניינים</h3><ol start="0"><li><a href="#arch">ארכיטקטורה ו-Docker</a></li>{toc}<li><a href="#rels">קשרים בין הטבלאות</a></li></ol></div>
    </div>

    <section class="domain" id="arch">
      <h2><span class="num">0</span> ארכיטקטורה</h2>
      <p class="intro">בקשה עוברת מהדפדפן דרך nginx לשרת FastAPI, משם לשכבת השירותים ולמסד הנתונים.</p>
      {arch}
      <div class="note">כל נקודות הקצה (חוץ מהרשמה, כניסה, איפוס סיסמה ו-health) דורשות כותרת <code dir="ltr">Authorization: Bearer &lt;JWT&gt;</code>. בטבלאות מסומנות ב־🔒.</div>
      <h3>Docker</h3>
      <table class="grid"><thead><tr><th>קובץ</th><th>תפקיד</th></tr></thead><tbody>{docker_rows}</tbody></table>
    </section>

    {''.join(domain_html(d, i + 1) for i, d in enumerate(DOMAINS))}

    <section class="domain" id="rels">
      <h2><span class="num">{len(DOMAINS) + 1}</span> קשרים בין הטבלאות</h2>
      <p class="intro">כל המפתחות הזרים (Foreign Keys) במסד: העמודה בצד ימין מצביעה על הטבלה בצד שמאל.</p>
      <table class="grid"><thead><tr><th>טבלה</th><th>עמודה</th><th></th><th>מצביעה על</th></tr></thead><tbody>{rel_rows}</tbody></table>
      <div class="note">כל המפתחות הראשיים הם UUID (מחרוזת באורך 36), חוץ מ־<code dir="ltr">password_reset_tokens.token</code> ומהמפתח המורכב של <code dir="ltr">family_members</code>.</div>
    </section>
    """

    return (
        f'<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>מפת הפרויקט – תקציב משפחתי</title>'
        f"<style>{css}</style></head><body>{body}</body></html>"
    )


def missing_translations(data: dict) -> list[str]:
    """Items in the code that have no Hebrew description yet (they fall back to the English docstring)."""
    missing = [c["name"] for c in data["classes"] if c["name"] not in CLASS_HE]
    missing += [
        f"{f['file']}:{f['name']}"
        for f in data["functions"]
        if not f["file"].startswith("app/api/") and f["name"] not in FUNC_HE and (f["file"], f["name"]) not in FUNC_FILE_HE
    ]
    missing += [f"{e['method']} {e['path']}" for e in data["endpoints"] if f"{e['method']} {e['path']}" not in ENDPOINT_HE]
    missing += [t["name"] for t in data["tables"] if t["name"] not in TABLE_HE]
    return missing


def unmapped_files(data: dict, frontend_files: dict[str, set[str]]) -> list[str]:
    """Backend files with code that belong to no section, and frontend files missing from (or stale in) FRONTEND_HE."""
    listed = {f for d in DOMAINS for f in d["files"]}
    problems = sorted({x["file"] for x in data["classes"] + data["functions"]} - listed)
    for feature, files in frontend_files.items():
        known = set(FRONTEND_HE.get(feature, {}))
        problems += [f"frontend/{feature}/{f} (not described)" for f in sorted(files - known)]
        problems += [f"frontend/{feature}/{f} (no longer exists)" for f in sorted(known - files)]
    return problems
