import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM t_secom_person")
    print("t_secom_person count:", cursor.fetchone()[0])
    
    # Let's see some example rows
    cursor.execute("SELECT Sabun, Name, Email FROM t_secom_person LIMIT 5")
    for r in cursor.fetchall():
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
