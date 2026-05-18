import os

dir_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp"
print(f"Listing files in: {dir_path}")

try:
    if os.path.exists(dir_path):
        for root, dirs, files in os.walk(dir_path):
            print(f"\n[Root]: {root}")
            for f in files:
                print(f"  {f} ({os.path.getsize(os.path.join(root, f))} bytes)")
    else:
        print("Erp directory does not exist!")
except Exception as e:
    print(f"Error: {e}")
