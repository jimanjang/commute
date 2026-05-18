import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT end_time, COUNT(*) FROM t_secom_schedule WHERE date = '2026-05-18' GROUP BY end_time")
    rows = cursor.fetchall()
    print("--- Schedule End Times for Today ---")
    for r in rows:
        print(f"End Time: {r[0]}, Count: {r[1]}")
        
except Exception as e:
    print(f"Error: {e}")
