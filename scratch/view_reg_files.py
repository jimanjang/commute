import os

erp_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp"

if not os.path.exists(erp_dir):
    # Try finding dynamically
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Erp" in root:
            erp_dir = root
            break

print(f"Reading reg files from: {erp_dir}")

for file in os.listdir(erp_dir):
    if file.endswith('.reg'):
        path = os.path.join(erp_dir, file)
        print(f"\n========================================\nFile: {path}\n========================================")
        try:
            with open(path, 'r', encoding='utf-16', errors='ignore') as f:
                content = f.read()
                print(content)
        except Exception:
            try:
                with open(path, 'r', encoding='cp949', errors='ignore') as f:
                    content = f.read()
                    print(content)
            except Exception as e:
                print(f"Error: {e}")
