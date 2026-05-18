import os

log_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18"

if not os.path.exists(log_dir):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Log" in root and "202605" in root:
            log_dir = root
            break

print(f"Reading logs from: {log_dir}")

target_times = ["10:28", "11:02", "11:08"]

for file in os.listdir(log_dir):
    path = os.path.join(log_dir, file)
    if os.path.isfile(path) and file.lower().endswith('.log'):
        print(f"\n========================================\nFile: {path}\n========================================")
        try:
            with open(path, 'r', encoding='cp949', errors='ignore') as f:
                lines = f.readlines()
                for line in lines:
                    if any(t in line for t in target_times):
                        print(line.strip())
        except Exception as e:
            print(f"Error reading file: {e}")
