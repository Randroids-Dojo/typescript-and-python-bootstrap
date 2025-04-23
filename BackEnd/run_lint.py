#!/usr/bin/env python
"""
Lint runner script for the backend service.
This script runs ruff using subprocess, ensuring linting can be executed
even if the ruff command is not available in the system path.
"""
import sys
import subprocess
import os

if __name__ == "__main__":
    try:
        # Run ruff directly via subprocess rather than try to import it
        # This avoids issues with different ruff versions and import paths
        
        # Try several possible ways to run ruff
        commands = [
            ["ruff", "check", "."],  # If ruff is installed globally
            ["python", "-m", "ruff", "check", "."],  # If ruff is installed as a module
            [sys.executable, "-m", "ruff", "check", "."]  # Using the current Python interpreter
        ]
        
        success = False
        
        for cmd in commands:
            try:
                print(f"Attempting to run: {' '.join(cmd)}")
                result = subprocess.run(cmd, check=False, capture_output=True, text=True)
                
                # If we get here, the command executed (even if it had errors)
                success = True
                
                # Print the output
                if result.stdout:
                    print(result.stdout)
                if result.stderr:
                    print(result.stderr, file=sys.stderr)
                
                # Exit with the return code from ruff
                sys.exit(result.returncode)
                
            except FileNotFoundError:
                # Command not found, try the next one
                continue
                
        if not success:
            # If we tried all commands and none worked
            print("Could not find ruff. Make sure it's installed properly.", file=sys.stderr)
            sys.exit(1)
                
    except Exception as e:
        print(f"Error running linting: {e}", file=sys.stderr)
        sys.exit(1)