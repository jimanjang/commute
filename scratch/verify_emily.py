import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT Name, Sabun, Email, CardNo FROM t_secom_person WHERE Name LIKE '%Emily%' OR Name LIKE '%에밀리%'")
    rows = cursor.fetchall()
    print("Found Emily records in t_secom_person:")
    for r in rows:
        print(r)
        
except Exception as e:
    print("Error:", e)
