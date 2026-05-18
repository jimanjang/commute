import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM t_secom_schedule WHERE date = '2026-05-18'")
    print("Schedules count today:", cursor.fetchone()[0])
    
    cursor.execute("SELECT COUNT(*) FROM t_secom_workhistory WHERE WorkDate = '20260518'")
    print("Workhistory count today:", cursor.fetchone()[0])
    
except Exception as e:
    print(f"Error: {e}")
