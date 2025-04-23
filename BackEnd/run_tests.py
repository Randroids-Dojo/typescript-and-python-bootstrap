#!/usr/bin/env python
"""
Test runner script for the backend service.
This script runs pytest programmatically, ensuring tests can be executed
even if the pytest command is not available in the system path.
"""
import sys
import subprocess

try:
    import pytest
    has_pytest = True
except ImportError:
    has_pytest = False

if __name__ == "__main__":
    try:
        if has_pytest:
            # Run pytest programmatically if available as a module
            # Get args from pytest.ini instead of hardcoding them here
            sys.exit(pytest.main())
        else:
            # Try to run pytest as a subprocess
            print("Pytest module not found, trying subprocess...")
            # Let pytest read configuration from pytest.ini
            result = subprocess.run(
                ["python", "-m", "pytest"],
                check=False, 
                capture_output=True, 
                text=True
            )
            print(result.stdout)
            if result.stderr:
                print(result.stderr, file=sys.stderr)
            sys.exit(result.returncode)
    except Exception as e:
        print(f"Error running tests: {e}", file=sys.stderr)
        sys.exit(1)