import os
import re

log_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18\\SecomLinkSendList.Log"

if not os.path.exists(log_path):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "SecomLinkSendList.Log" in files:
            log_path = os.path.join(root, "SecomLinkSendList.Log")
            break

print(f"Reading SecomLinkSendList.Log: {log_path}")

try:
    with open(log_path, 'r', encoding='cp949', errors='ignore') as f:
        content = f.read()
        if '\x00' in content:
            content = content.replace('\x00', '')
            
        lines = content.split('\n')
        # Parse each line to find timestamps and the actions
        sends = []
        for line in lines:
            if 'Send OK' in line or 'Send Failed' in line:
                sends.append(line.strip())
                
        print(f"Total Send entries today: {len(sends)}")
        # Group by timestamp (first 8 chars: HH:MM:SS) and type (Auto or Manual)
        grouped = {}
        for s in sends:
            match = re.match(r'^(\d{2}:\d{2}:\d{2})\s*:\s*(Send\s+\w+)\((\w+)\)', s)
            if match:
                ts, status, mode = match.groups()
                # Check target user
                user_match = re.search(r'->.*,\s*([^,]+)$', s)
                user = user_match.group(1).strip() if user_match else "Unknown"
                
                key = (ts, status, mode)
                if key not in grouped:
                    grouped[key] = []
                grouped[key].append(user)
                
        print("\n--- Summary of Send Events Today ---")
        for key in sorted(grouped.keys()):
            ts, status, mode = key
            users = list(set(grouped[key]))
            count = len(grouped[key])
            if count > 5:
                print(f"{ts} | {status}({mode}) | Count: {count} | Sample Users: {users[:5]}...")
            else:
                print(f"{ts} | {status}({mode}) | Count: {count} | Users: {users}")
except Exception as e:
    print(f"Error: {e}")
