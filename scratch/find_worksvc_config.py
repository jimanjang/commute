import os

dir_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1"
print(f"Finding configs for WorkSvc in: {dir_path}")

try:
    for root, dirs, files in os.walk(dir_path):
        for f in files:
            if 'svc' in f.lower() or 'work' in f.lower() or 'config' in f.lower() or 'ini' in f.lower():
                full_path = os.path.join(root, f)
                print(f"  {full_path} ({os.path.getsize(full_path)} bytes)")
except Exception as e:
    print(f"Error: {e}")
