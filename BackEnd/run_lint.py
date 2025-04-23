#!/usr/bin/env python
"""
Lint runner script for the backend service.
This script runs ruff programmatically, ensuring linting can be executed
even if the ruff command is not available in the system path.
"""
import sys
import subprocess

try:
    # Try importing ruff
    import ruff
    has_ruff = True
except ImportError:
    has_ruff = False

if __name__ == "__main__":
    try:
        if has_ruff:
            # Run ruff programmatically if available as a module
            from ruff.__main__ import main as ruff_main
            sys.exit(ruff_main(["check", "."]))
        else:
            # Try to run ruff as a subprocess
            result = subprocess.run(["python", "-m", "ruff", "check", "."], 
                                   check=False, capture_output=True, text=True)
            print(result.stdout)
            if result.stderr:
                print(result.stderr, file=sys.stderr)
            sys.exit(result.returncode)
    except Exception as e:
        print(f"Error running linting: {e}", file=sys.stderr)
        sys.exit(1)