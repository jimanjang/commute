import pymysql

try:
    conn = pymysql.connect(
        host='172.17.3.206',
        user='secom',
        password='secom123',
        db='secom',
        charset='utf8mb4'
    )
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    date = "20260414"
    print(f"Listing all records for Date: {date}")
    cursor.execute("SELECT Name, WSTime, WCTime FROM t_secom_workhistory WHERE WorkDate = %s LIMIT 20", (date,))
    rows = cursor.fetchall()
    for row in rows:
        print(row)
    
    conn.close()
except Exception as e:
    print("Error:", e)
