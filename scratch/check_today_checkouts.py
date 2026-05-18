import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT Sabun, Name, WSTime, WCTime, bWC FROM t_secom_workhistory WHERE WorkDate = '20260518' AND WCTime IS NOT NULL")
    rows = cursor.fetchall()
    print("--- Today's Checkouts in MySQL ---")
    print(f"Total Rows: {len(rows)}")
    for r in rows:
        print(f"Sabun: {r[0]}, Name: {r[1]}, WSTime: {r[2]}, WCTime: {r[3]}, bWC: {r[4]}")
        
except Exception as e:
    print(f"Error: {e}")
