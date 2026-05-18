import os
import re

log_base_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log"

if not os.path.exists(log_base_dir):
    # Find dynamically
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Log" in root:
            log_base_dir = root
            break

timestamps = []

# Walk through all directories in Log
for root, dirs, files in os.walk(log_base_dir):
    for file in files:
        if file.lower() == 'secomlinksendlist.log':
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='cp949', errors='ignore') as f:
                    content = f.read()
                    if '\x00' in content:
                        content = content.replace('\x00', '')
                    
                    # Search for timestamps like 11:08:29 followed by Send OK(Auto) or Send Failed(Auto)
                    # We can use regex to find all matches of HH:MM:SS : Send OK(Auto)
                    cleaned = re.sub(r'\s+', ' ', content)
                    matches = re.findall(r'(\d{2}:\d{2}:\d{2})\s*:\s*Send\s*OK\(Auto\)', cleaned)
                    for m in matches:
                        timestamps.append((file, m))
            except Exception as e:
                print(f"Error reading {path}: {e}")

print(f"Found {len(timestamps)} Auto Send successes.")
# Count frequency of hours/minutes to find the interval
print("\n--- Recent Auto Send Timestamps ---")
for f, ts in sorted(timestamps)[-100:]:
    print(f"{f} -> {ts}")
