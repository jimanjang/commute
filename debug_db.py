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
    
    # Check for laika (Jang Jiman)
    name = "장지만"
    date = "20260414"
    
    print(f"Checking for Name: {name}, Date: {date}")
    cursor.execute("SELECT * FROM t_secom_workhistory WHERE Name = %s AND WorkDate = %s", (name, date))
    rows = cursor.fetchall()
    print("MySQL Rows:", rows)
    
    conn.close()
except Exception as e:
    print("Error:", e)
