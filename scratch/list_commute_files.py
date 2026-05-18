import os

dir_path = "c:\\Users\\당근서비스\\.antigravity\\secom-admin\\commute"
print(f"Listing top level files in: {dir_path}")

try:
    for f in os.listdir(dir_path):
        full_path = os.path.join(dir_path, f)
        if os.path.isfile(full_path):
            print(f"  {f} ({os.path.getsize(full_path)} bytes)")
except Exception as e:
    print(f"Error: {e}")
