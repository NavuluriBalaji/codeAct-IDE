from __future__ import annotations

import hashlib
import io
import json
import pathlib
import tarfile
import zipfile

import requests


MONACO_VERSION = "0.50.0"
PYODIDE_VERSION = "0.26.4"


def _repo_root() -> pathlib.Path:
    # .../src/codeact_ide/vendor_assets.py -> .../ (repo)
    return pathlib.Path(__file__).resolve().parents[3]


def _vendor_root() -> pathlib.Path:
    return pathlib.Path(__file__).resolve().parent / "ui" / "vendor"


def _sha256(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()


def _download(url: str, *, timeout_s: int = 60) -> tuple[bytes, dict]:
    r = requests.get(url, timeout=timeout_s)
    r.raise_for_status()
    return r.content, {"url": url, "status": r.status_code, "bytes": len(r.content), "sha256": _sha256(r.content)}


def _ensure_clean_dir(path: pathlib.Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _extract_monaco(tgz_bytes: bytes, dest_vs_dir: pathlib.Path) -> None:
    """
    Extracts monaco-editor's `package/min/vs/**` into dest_vs_dir.
    """
    _ensure_clean_dir(dest_vs_dir)

    with tarfile.open(fileobj=io.BytesIO(tgz_bytes), mode="r:gz") as tf:
        members = tf.getmembers()
        prefix = "package/min/vs/"

        selected = [m for m in members if m.name.startswith(prefix) and m.isfile()]
        if not selected:
            raise RuntimeError("monaco-editor archive missing package/min/vs/")

        for m in selected:
            rel = pathlib.Path(m.name[len(prefix) :])
            out_path = dest_vs_dir / rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            f = tf.extractfile(m)
            if f is None:
                continue
            out_path.write_bytes(f.read())


def _extract_zip(zip_bytes: bytes, dest_dir: pathlib.Path) -> None:
    _ensure_clean_dir(dest_dir)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        zf.extractall(dest_dir)


def _extract_tarbz2(tarbz2_bytes: bytes, dest_dir: pathlib.Path) -> None:
    _ensure_clean_dir(dest_dir)
    with tarfile.open(fileobj=io.BytesIO(tarbz2_bytes), mode="r:bz2") as tf:
        tf.extractall(dest_dir)


def vendor_assets() -> dict:
    vendor_root = _vendor_root()
    vendor_root.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, object] = {
        "monaco_version": MONACO_VERSION,
        "pyodide_version": PYODIDE_VERSION,
        "downloads": {},
    }

    # Monaco (npm tarball)
    monaco_url = f"https://registry.npmjs.org/monaco-editor/-/monaco-editor-{MONACO_VERSION}.tgz"
    monaco_bytes, monaco_meta = _download(monaco_url)
    manifest["downloads"]["monaco"] = monaco_meta
    _extract_monaco(monaco_bytes, vendor_root / "monaco" / "vs")

    # Pyodide (release tar.bz2; "core" is sufficient to boot Pyodide offline)
    pyodide_url = (
        f"https://github.com/pyodide/pyodide/releases/download/{PYODIDE_VERSION}/pyodide-core-{PYODIDE_VERSION}.tar.bz2"
    )
    pyodide_bytes, pyodide_meta = _download(pyodide_url)
    manifest["downloads"]["pyodide"] = pyodide_meta
    _extract_tarbz2(pyodide_bytes, vendor_root / "pyodide" / f"core-{PYODIDE_VERSION}")

    (vendor_root / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    manifest = vendor_assets()
    print("Vendored assets into:", _vendor_root())
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()

