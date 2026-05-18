import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT ATime, CardNo, Name, InsertTime FROM t_secom_alarm WHERE ATime >= '20260518130000' ORDER BY ATime DESC")
    rows = cursor.fetchall()
    print("--- Alarms since 13:00 today ---")
    for r in rows:
        print(f"ATime: {r[0]}, CardNo: {r[1]}, Name: {r[2]}, DB InsertTime: {r[3]}")
        
except Exception as e:
    print(f"Error: {e}")
