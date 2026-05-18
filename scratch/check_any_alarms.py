import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT ATime, CardNo, Name FROM t_secom_alarm WHERE ATime LIKE '20260518%' ORDER BY ATime DESC LIMIT 10")
    rows = cursor.fetchall()
    print("--- Latest alarms today ---")
    for r in rows:
        print(f"ATime: {r[0]}, CardNo: {r[1]}, Name: {r[2]}")
        
except Exception as e:
    print(f"Error: {e}")
