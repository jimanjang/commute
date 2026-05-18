import os

log_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18"

if not os.path.exists(log_dir):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Log" in root and "202605" in root:
            log_dir = root
            break

print(f"Reading logs from: {log_dir}")

search_terms = ["SecomLink", "E-SLNK", "WN-1203", "WN-1204", "Send", "Auto"]

for file in os.listdir(log_dir):
    path = os.path.join(log_dir, file)
    if os.path.isfile(path) and file.lower().endswith('.log'):
        print(f"\n========================================\nFile: {path}\n========================================")
        try:
            with open(path, 'r', encoding='cp949', errors='ignore') as f:
                lines = f.readlines()
                match_count = 0
                for line in lines:
                    if any(term.lower() in line.lower() for term in search_terms):
                        print(line.strip())
                        match_count += 1
                        if match_count > 100:
                            print("... (truncated after 100 matches)")
                            break
        except Exception as e:
            print(f"Error reading file: {e}")
