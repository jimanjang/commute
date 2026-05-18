import os

log_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18\\WorkManager.log"
if not os.path.exists(log_path):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "WorkManager.log" in files:
            log_path = os.path.join(root, "WorkManager.log")
            break

print(f"Reading WorkManager.log tail from: {log_path}")

try:
    with open(log_path, 'r', encoding='cp949', errors='ignore') as f:
        content = f.read()
        lines = content.split('\n')
        print(f"Total lines: {len(lines)}")
        print("\n--- Last 30 lines of WorkManager.log ---")
        for line in lines[-30:]:
            if line.strip():
                print(line.strip())
except Exception as e:
    print(f"Error: {e}")
