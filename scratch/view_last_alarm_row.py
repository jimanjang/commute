import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM t_secom_alarm ORDER BY ATime DESC LIMIT 1")
    row = cursor.fetchone()
    print("--- Last Row ---")
    columns = [desc[0] for desc in cursor.description]
    for col, val in zip(columns, row):
        print(f"{col}: {val}")
        
except Exception as e:
    print(f"Error: {e}")
