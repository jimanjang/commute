import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM t_secom_workhistory WHERE Sabun = 'KS2203002' AND WorkDate = '20260518'")
    row = cursor.fetchone()
    print("--- Taro's Row in MySQL ---")
    print(row)
    
    # Let's see columns
    cursor.execute("DESCRIBE t_secom_workhistory")
    cols = [c[0] for c in cursor.fetchall()]
    print("Columns:", cols)
    
except Exception as e:
    print(f"Error: {e}")
