import pymysql
import json
import os
from datetime import datetime

backup_path = r"C:\Users\당근서비스\.antigravity\secom-admin\commute\scratch\backup_today_data.json"

if not os.path.exists(backup_path):
    print("Backup file not found!")
    exit(1)

with open(backup_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

def format_val(val):
    if val is None:
        return None
    # If it is a string representing an ISO date like '2026-05-17T15:00:00.000Z'
    if isinstance(val, str) and ('T' in val) and ('Z' in val):
        try:
            # Parse ISO string
            dt = datetime.strptime(val, "%Y-%m-%dT%H:%M:%S.%fZ")
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass
    return val

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # 1. Clear today
    cursor.execute("DELETE FROM t_secom_schedule WHERE date = '2026-05-18'")
    cursor.execute("DELETE FROM t_secom_workhistory WHERE WorkDate = '20260518'")
    print("Cleared today's records for restore.")
    
    # 2. Restore schedules
    schedules = data.get('schedules', [])
    for s in schedules:
        cols = list(s.keys())
        vals = [format_val(s[c]) for c in cols]
        
        # Specific formatting for schedule date
        # if column is 'date', we must format it to YYYY-MM-DD
        if 'date' in cols:
            idx = cols.index('date')
            if vals[idx] is not None:
                # If it's a datetime string, extract YYYY-MM-DD
                vals[idx] = vals[idx][:10]
                
        placeholders = ', '.join(['%s'] * len(cols))
        query = f"INSERT INTO t_secom_schedule ({', '.join(cols)}) VALUES ({placeholders})"
        cursor.execute(query, vals)
        
    print(f"Restored {len(schedules)} schedules.")
    
    # 3. Restore workhistory
    workhistory = data.get('workHistory', [])
    for w in workhistory:
        cols = list(w.keys())
        vals = [format_val(w[c]) for c in cols]
        placeholders = ', '.join(['%s'] * len(cols))
        query = f"INSERT INTO t_secom_workhistory ({', '.join(cols)}) VALUES ({placeholders})"
        cursor.execute(query, vals)
        
    print(f"Restored {len(workhistory)} workhistory records.")
    
    conn.commit()
    print("--- RESTORE COMPLETED SUCCESSFULY ---")
    
except Exception as e:
    print(f"CRITICAL ERROR on restore: {e}")
