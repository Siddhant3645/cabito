# diag_opening_hours.py
import opening_hours
from opening_hours import OpeningHours, ParserError
from datetime import datetime # Ensure datetime is imported for the test

print(f"--- Library Details ---")
print(f"opening_hours module object: {opening_hours}")
print(f"Path of opening_hours module: {opening_hours.__file__}")
print(f"Version of opening_hours: {getattr(opening_hours, '__version__', 'N/A')}")

print(f"\n--- OpeningHours Class (Imported Directly) ---")
print(f"Type: {type(OpeningHours)}")
print(f"ID in memory: {id(OpeningHours)}")
print(f"__module__: {OpeningHours.__module__}")
print(f"__name__: {OpeningHours.__name__}")
print(f"__qualname__: {OpeningHours.__qualname__}")
print(f"Methods/Attributes (dir): {dir(OpeningHours)}")

print(f"\n--- ParserError Class (Imported Directly) ---")
print(f"Type: {type(ParserError)}")
print(f"__module__: {ParserError.__module__}")

print(f"\n--- Instantiation and Method Test ---")
test_oh_string = "Mo-Fr 09:00-17:00"
print(f"Using opening hours string: '{test_oh_string}'")

try:
    # Instantiate the imported OpeningHours class
    oh_instance = OpeningHours(test_oh_string)
    print(f"Successfully instantiated: {oh_instance}")
    print(f"Instance class __module__: {oh_instance.__class__.__module__}")
    print(f"Instance class __name__: {oh_instance.__class__.__name__}")
    print(f"Instance methods/attributes (dir): {dir(oh_instance)}")

    # Test for the presence of the method
    if hasattr(oh_instance, 'get_next_open_time'):
        print("'get_next_open_time' method IS PRESENT on the instance.")
        # Test calling the method
        test_datetime = datetime(2025, 6, 5, 18, 0, 0) # A time when it's closed
        next_open = oh_instance.get_next_open_time(test_datetime)
        print(f"Called get_next_open_time({test_datetime}), result: {next_open}")
    else:
        print("'get_next_open_time' method IS MISSING from the instance.")

    if hasattr(oh_instance, 'is_open'):
        print("'is_open' method IS PRESENT on the instance.")
        is_it_open = oh_instance.is_open(datetime(2025, 6, 5, 10, 0, 0)) # A time when it should be open
        print(f"Called is_open(2025-06-05 10:00), result: {is_it_open}")
    else:
        print("'is_open' method IS MISSING from the instance.")

except Exception as e:
    print(f"Error during instantiation or method test: {e}")
    import traceback
    traceback.print_exc()