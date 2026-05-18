import os

dir_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1"
print(f"Finding all EXEs and Configs in: {dir_path}")

try:
    for root, dirs, files in os.walk(dir_path):
        for f in files:
            if f.lower().endswith('.exe') or f.lower().endswith('.config'):
                full_path = os.path.join(root, f)
                print(f"  {full_path} ({os.path.getsize(full_path)} bytes)")
except Exception as e:
    print(f"Error: {e}")
