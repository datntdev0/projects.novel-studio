import logging
import os
import sys
import threading
from logging.handlers import RotatingFileHandler

FORMAT = "%(asctime)s.%(msecs)03d %(levelname)s %(name)s %(message)s"
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"


def setup_logging(log_dir: str) -> None:
    handler = RotatingFileHandler(os.path.join(log_dir, "python.log"), maxBytes=1_048_576, backupCount=3, encoding="utf-8")
    handler.setFormatter(logging.Formatter(FORMAT, DATE_FORMAT))
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(handler)
    sys.excepthook = log_uncaught
    threading.excepthook = log_uncaught_in_thread


def log_uncaught(exc_type, exc_value, exc_traceback) -> None:
    logging.getLogger("app").critical("uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))


def log_uncaught_in_thread(args: threading.ExceptHookArgs) -> None:
    log_uncaught(args.exc_type, args.exc_value, args.exc_traceback)
