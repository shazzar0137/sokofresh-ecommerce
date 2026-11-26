"""Load backend/.env (if present) before any settings module applies defaults.

dev.py and test.py import this first, so values in .env win over their
built-in development defaults (review finding ARCH-4). Real environment
variables always win over .env. Production hosts do not use a .env file.
"""

from pathlib import Path

import environ

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


def load_env_file(path: Path = ENV_FILE) -> None:
    if path.is_file():
        environ.Env.read_env(path)


load_env_file()
