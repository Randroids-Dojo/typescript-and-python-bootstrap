#!/usr/bin/env python
"""
Test runner script for the backend service.
This script runs pytest programmatically, ensuring tests can be executed
even if the pytest command is not available in the system path.
"""
import sys
import pytest

if __name__ == "__main__":
    # Run pytest programmatically
    sys.exit(pytest.main(["-v", "tests/"]))