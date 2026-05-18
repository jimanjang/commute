import os

log_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18"

if not os.path.exists(log_dir):
    # Try finding dynamically
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Log" in root and "202605" in root:
            log_dir = root
            break

print(f"Reading logs from: {log_dir}")

log_files = ['WorkSvc.Log', 'WorkManager.log', 'SecomLinkSendList.Log']

for file in log_files:
    path = os.path.join(log_dir, file)
    if os.path.exists(path):
        print(f"\n========================================\nFile: {path}\n========================================")
        try:
            with open(path, 'r', encoding='cp949', errors='ignore') as f:
                lines = f.readlines()
                # Print last 80 lines
                for line in lines[-80:]:
                    print(line.strip())
        except Exception as e:
            print(f"Error reading file: {e}")
    else:
        print(f"File not found: {path}")
