# test_import.py
import sys
print(f"--- Test Import Script ---")
print(f"Running with: {sys.executable}")
print(f"Sys path includes venv site-packages: {'/Users/home/Downloads/Cabito/backend/venv/lib/python3.11/site-packages' in sys.path}") # Specific check
try:
    import opening_hours
    print("Successfully imported 'opening_hours'")
    print(f"Location: {opening_hours.__file__}")
except ImportError as e:
    print(f"Failed to import 'opening_hours': {e}")
except Exception as e_other:
    print(f"An other error occurred during import test: {e_other}")
print(f"--- End Test Import Script ---")