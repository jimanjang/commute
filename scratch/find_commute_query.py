import os

search_dirs = [
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\SecomLink"
]

for d in search_dirs:
    if os.path.exists(d):
        print(f"\n========================================\nDirectory: {d}\n========================================")
        for file in os.listdir(d):
            path = os.path.join(d, file)
            if os.path.isfile(path):
                print(f"File: {file} ({os.path.getsize(path)} bytes)")
                try:
                    with open(path, 'r', encoding='cp949', errors='ignore') as f:
                        content = f.read()
                        if 'select' in content.lower() or 'update' in content.lower() or 'insert' in content.lower():
                            print(f"--- Content of {file} ---")
                            print(content[:1500])
                except Exception as e:
                    print(f"Error reading {file}: {e}")
