import os

log_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18"

if not os.path.exists(log_dir):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Log" in root and "202605" in root:
            log_dir = root
            break

print(f"Reading logs from: {log_dir}")

for file in os.listdir(log_dir):
    path = os.path.join(log_dir, file)
    if os.path.isfile(path) and 'sendlist' in file.lower():
        print(f"\n========================================\nFile: {path}\n========================================")
        try:
            with open(path, 'r', encoding='cp949', errors='ignore') as f:
                content = f.read()
                if '\x00' in content:
                    content = content.replace('\x00', '')
                
                # Print lines containing "11:02" or "10:28"
                lines = content.split('\n')
                for line in lines:
                    if '11:02' in line or '10:28' in line or '11:08' in line:
                        print(line.strip())
        except Exception as e:
            print(f"Error reading file: {e}")
