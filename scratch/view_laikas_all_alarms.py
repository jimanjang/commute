import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT ATime, Name, CardNo, InsertTime, State FROM t_secom_alarm WHERE ATime LIKE '20260518%' AND CardNo = '0109338254950' ORDER BY ATime ASC")
    rows = cursor.fetchall()
    print("--- All Laika Alarms Today ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
