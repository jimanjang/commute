import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT Name, Sabun, Email, Team, CardNo FROM t_secom_person WHERE Name LIKE 'Austin%'")
    for r in cursor.fetchall():
        print(r)
        
except Exception as e:
    print("Error:", e)
