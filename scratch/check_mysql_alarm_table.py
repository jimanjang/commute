import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Check if t_secom_alarm table exists and get recent rows
    cursor.execute("SHOW TABLES LIKE 't_secom_alarm'")
    table_exists = cursor.fetchone()
    print(f"Table t_secom_alarm exists: {bool(table_exists)}")
    
    if table_exists:
        cursor.execute("SELECT COUNT(*) FROM t_secom_alarm")
        count = cursor.fetchone()[0]
        print(f"Total rows in t_secom_alarm: {count}")
        
        cursor.execute("SELECT * FROM t_secom_alarm ORDER BY ATime DESC LIMIT 10")
        rows = cursor.fetchall()
        print("\n--- Recent 10 rows in t_secom_alarm ---")
        for r in rows:
            print(r)
            
except Exception as e:
    print(f"Error: {e}")
