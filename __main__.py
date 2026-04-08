from __future__ import annotations

import os
import sys

def _configure_qtwebengine_env() -> None:
    """
    Must run BEFORE importing anything that touches QtWebEngine.
    Many GPU-related white/blank screens on Windows only resolve if these flags
    are present at renderer startup.
    """

    # Force software rendering paths.
    os.environ.setdefault("QTWEBENGINE_DISABLE_GPU", "1")

    # Add Chromium flags (preserve any user-provided flags).
    existing = os.environ.get("QTWEBENGINE_CHROMIUM_FLAGS", "")
    extra = " ".join(
        [
            "--disable-gpu",
            "--disable-gpu-compositing",
            "--use-gl=swiftshader",
            "--use-angle=swiftshader",
            "--disable-features=VizDisplayCompositor",
        ]
    )
    os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = (existing + " " + extra).strip()


def main() -> int:
    _configure_qtwebengine_env()
    # Import after env is configured.
    from codeact_ide.app.main import run_app

    return run_app(sys.argv[1:])


if __name__ == "__main__":
    raise SystemExit(main())
