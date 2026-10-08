import logging
import os
import sys
import time

from app.logging_setup import setup_logging
from app.watchdog import start_watchdog

MIN_TOKEN_LENGTH = 32


def read_int(name: str) -> int:
    return int(os.environ[name])


def main() -> int:
    log_dir = os.environ.get("NS_LOG_DIR", "")
    if not os.path.isdir(log_dir):
        return 2
    setup_logging(log_dir)

    try:
        port = read_int("NS_BACKEND_PORT")
        parent_pid = read_int("NS_PARENT_PID")
        delay_ms = read_int("NS_TEST_BACKEND_START_DELAY_MS") if "NS_TEST_BACKEND_START_DELAY_MS" in os.environ else 0
        token = os.environ["NS_BACKEND_TOKEN"]
        if len(token) < MIN_TOKEN_LENGTH or not 0 < port < 65536 or parent_pid <= 0 or delay_ms < 0:
            raise ValueError("out of range")
    except (KeyError, ValueError) as error:
        logging.getLogger("app").error("invalid environment: %s", type(error).__name__)
        return 2

    start_watchdog(parent_pid)
    if delay_ms:
        time.sleep(delay_ms / 1000)

    from app.main import run

    run(port, token)
    return 0


sys.exit(main())
