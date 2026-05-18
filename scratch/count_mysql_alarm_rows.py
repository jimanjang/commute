import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM t_secom_alarm")
    count = cursor.fetchone()[0]
    print(f"Total rows in t_secom_alarm: {count}")
    
    cursor.execute("SELECT ATime, Name, CardNo, InsertTime FROM t_secom_alarm ORDER BY ATime DESC LIMIT 10")
    rows = cursor.fetchall()
    print("\n--- Recent 10 Synced Alarms ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
