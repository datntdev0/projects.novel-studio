import ctypes
import logging
import os
import threading
from ctypes import wintypes

SYNCHRONIZE = 0x00100000
INFINITE = 0xFFFFFFFF
WAIT_FAILED = 0xFFFFFFFF

logger = logging.getLogger("app.watchdog")


def start_watchdog(parent_pid: int) -> None:
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.WaitForMultipleObjects.restype = wintypes.DWORD
    kernel32.WaitForMultipleObjects.argtypes = [wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE), wintypes.BOOL, wintypes.DWORD]

    pids = list(dict.fromkeys([parent_pid, os.getppid()]))
    handles = []
    for pid in pids:
        handle = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
        if not handle:
            exit_parent_gone(pid)
        handles.append(handle)

    handle_array = (wintypes.HANDLE * len(handles))(*handles)

    def wait() -> None:
        result = kernel32.WaitForMultipleObjects(len(handles), handle_array, False, INFINITE)
        exit_parent_gone(pids[result] if result < len(pids) else pids[0])

    threading.Thread(target=wait, name="watchdog", daemon=True).start()


def exit_parent_gone(pid: int) -> None:
    logger.info("parent gone %d, exiting", pid)
    logging.shutdown()
    os._exit(0)
