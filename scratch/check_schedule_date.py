import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT date FROM t_secom_schedule LIMIT 5")
    for r in cursor.fetchall():
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
