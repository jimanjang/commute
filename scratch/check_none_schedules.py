import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT email, start_time, end_time, sheet_type_description FROM t_secom_schedule WHERE date = '2026-05-18' AND end_time IS NULL")
    rows = cursor.fetchall()
    print("--- None Schedule Ends ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
