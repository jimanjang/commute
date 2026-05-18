import pymysql
import os

print("--- Checking MySQL t_secom_alarm for user clock-out ---")
try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Query alarms for today around 12:23
    cursor.execute("SELECT ATime, Name, CardNo, InsertTime, State FROM t_secom_alarm WHERE ATime >= '20260518122000' ORDER BY ATime ASC")
    rows = cursor.fetchall()
    print(f"Found {len(rows)} matching rows in MySQL since 12:20:")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error checking MySQL: {e}")

print("\n--- Checking SecomLinkSendList.Log around 12:23 ---")
log_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Log\\202605\\18\\SecomLinkSendList.Log"
if not os.path.exists(log_path):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "SecomLinkSendList.Log" in files:
            log_path = os.path.join(root, "SecomLinkSendList.Log")
            break

try:
    with open(log_path, 'r', encoding='cp949', errors='ignore') as f:
        content = f.read()
        if '\x00' in content:
            content = content.replace('\x00', '')
            
        lines = content.split('\n')
        for line in lines:
            if '12:23' in line or '12:24' in line:
                print(line.strip())
except Exception as e:
    print(f"Error checking log: {e}")
