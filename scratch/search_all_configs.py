import os

search_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1"

if not os.path.exists(search_dir):
    # Try finding dynamically
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "v9" in root:
            search_dir = root
            break

print(f"Scanning for config files in: {search_dir}")

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.lower().endswith(('.ini', '.config', '.properties', '.txt', '.xml')) and 'log' not in file.lower() and 'sqlite' not in file.lower():
            file_path = os.path.join(root, file)
            size = os.path.getsize(file_path)
            if size < 50000: # Only read smaller files
                print(f"\n========================================\nFile: {file_path} ({size} bytes)\n========================================")
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        # print first 50 lines
                        for line in lines[:80]:
                            print(line.strip())
                except Exception as e:
                    print(f"Error reading file: {e}")
