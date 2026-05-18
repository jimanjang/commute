import os

# Resilient path finder
def find_db():
    search_dirs = [
        "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Database",
        "C:\\"
    ]
    for search_dir in search_dirs:
        if not os.path.exists(search_dir):
            continue
        for root, dirs, files in os.walk(search_dir):
            for file in files:
                if file.lower() == 'workmanager.db':
                    return os.path.join(root, file)
    return None

db_path = find_db()
if not db_path:
    print("Error: Could not find WorkManager.DB automatically.")
    exit(1)

with open(db_path, 'rb') as f:
    header = f.read(32)
    print("--- HEX Header ---")
    print(header.hex())
    print("\n--- ASCII Header ---")
    print(header)
