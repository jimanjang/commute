import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("DESCRIBE t_secom_person")
    rows = cursor.fetchall()
    print("--- t_secom_person Columns ---")
    for r in rows:
        print(r[0], r[1])
        
except Exception as e:
    print(f"Error: {e}")
