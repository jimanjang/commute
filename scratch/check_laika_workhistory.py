import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM t_secom_workhistory WHERE WorkDate = '20260518' AND Name LIKE '%Laika%' OR Name LIKE '%라이카%'")
    rows = cursor.fetchall()
    print("--- Laika in t_secom_workhistory ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
