import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT CardNo, Sabun, Name FROM t_secom_person WHERE Name LIKE '%Laika%' OR Name LIKE '%라이카%'")
    rows = cursor.fetchall()
    print("--- Laika in t_secom_person ---")
    for r in rows:
        print(f"CardNo: {r[0]}, Sabun: {r[1]}, Name: {r[2]}")
        
except Exception as e:
    print(f"Error: {e}")
