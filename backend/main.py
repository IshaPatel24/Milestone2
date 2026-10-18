import sys
from pathlib import Path

# Ensure backend directory is in sys.path for Vercel execution
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

# Expose app for Vercel zero-config and standard ASGI runners
__all__ = ["app"]
