"""
This module and its submodules contains utilities for running external
processes and interfacing with job managers. This module should contain
functionality shared between Galaxy and the LWR.
"""
try:
    from galaxy.util import Bunch
except ImportError:
    from lwr.util import Bunch

from .kill import kill_pid

__all__ = [kill_pid, Bunch]
