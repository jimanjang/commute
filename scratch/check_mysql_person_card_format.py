import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT CardNo, Name, Sabun, Email FROM t_secom_person WHERE Name LIKE '%라이카%' OR Name LIKE '%Laika%' LIMIT 5")
    rows = cursor.fetchall()
    print("--- Laika in t_secom_person ---")
    for r in rows:
        print(r)
        
    cursor.execute("SELECT CardNo, Name, Sabun FROM t_secom_person LIMIT 5")
    rows = cursor.fetchall()
    print("\n--- Sample rows in t_secom_person ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
