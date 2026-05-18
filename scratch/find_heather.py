import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT CardNo, Sabun, Name FROM t_secom_person WHERE Name LIKE '%Heather%' OR Name LIKE '%헤더%' OR Name LIKE '%Maren%' OR Name LIKE '%마렌%'")
    rows = cursor.fetchall()
    print("--- Results ---")
    for r in rows:
        print(f"CardNo: {r[0]}, Sabun: {r[1]}, Name: {r[2]}")
        
except Exception as e:
    print(f"Error: {e}")
