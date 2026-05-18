import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT Name, Sabun, Email, Team FROM t_secom_person WHERE Sabun IN ('KS2409044', 'KS2506021', 'KS2602009')")
    rows = cursor.fetchall()
    print("MySQL Duplicate Sabun Rows:")
    for r in rows:
        print(r)
        
except Exception as e:
    print("Error:", e)
