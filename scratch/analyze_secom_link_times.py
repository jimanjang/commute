import os
import re

log_base_dir = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log"

if not os.path.exists(log_base_dir):
    # Find dynamically
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "Log" in root:
            log_base_dir = root
            break

print(f"Scanning SecomLinkSendList.Log in: {log_base_dir}")

auto_send_times = []

# Walk through all directories in Log
for root, dirs, files in os.walk(log_base_dir):
    for file in files:
        if file.lower() == 'secomlinksendlist.log':
            path = os.path.join(root, file)
            try:
                # Read with CP949
                with open(path, 'r', encoding='cp949', errors='ignore') as f:
                    content = f.read()
                    
                    # Sometimes logs have spaces between characters (utf-16 or similar formatting saved in ASCII)
                    # Let's clean up any null bytes or spaces between characters
                    if '\x00' in content or 'S e n d' in content:
                        # Clean up spaced characters
                        content = content.replace('\x00', '')
                        content = re.sub(r'(\w)\s+(\w)', r'\1\2', content)
                        content = content.replace('   ', ' ')
                        content = content.replace(' : ', ':')

                    # Find all lines containing "Send OK(Auto)" or similar
                    lines = content.split('\n')
                    for line in lines:
                        if 'Auto' in line or 'Send OK' in line or 'Auto' in line.replace(' ', ''):
                            auto_send_times.append(f"{file} | {line.strip()}")
            except Exception as e:
                print(f"Error reading {path}: {e}")

print(f"\nFound {len(auto_send_times)} total Auto Send events:")
# Print the last 60 unique events to see the pattern
unique_events = sorted(list(set(auto_send_times)))
for event in unique_events[-60:]:
    print(event)
