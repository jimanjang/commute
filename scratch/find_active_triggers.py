import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, function_name, time_type, time_value, is_active FROM t_secom_trigger")
    rows = cursor.fetchall()
    print("--- Active Triggers in MySQL ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
