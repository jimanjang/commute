import os

erp_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp"

if not os.path.exists(erp_dir):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Erp" in root:
            erp_dir = root
            break

print(f"Scanning query files in: {erp_dir}")

for file in os.listdir(erp_dir):
    if file.endswith('.txt'):
        path = os.path.join(erp_dir, file)
        try:
            with open(path, 'r', encoding='cp949', errors='ignore') as f:
                content = f.read()
                print(f"\n========================================\nFile: {file}\n========================================")
                print(content[:2000]) # First 2000 chars
        except Exception as e:
            print(f"Error reading {file}: {e}")
