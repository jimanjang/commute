import os

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
        # Print the last 30 lines
        print("\n--- Last 30 lines of SecomLinkSendList.Log ---")
        for line in lines[-30:]:
            if line.strip():
                print(line.strip())
except Exception as e:
    print(f"Error: {e}")
