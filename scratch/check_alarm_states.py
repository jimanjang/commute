import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT State, COUNT(*) FROM t_secom_alarm GROUP BY State")
    rows = cursor.fetchall()
    print("--- Unique States in t_secom_alarm ---")
    for r in rows:
        print(r)
        
    cursor.execute("SELECT Param, COUNT(*) FROM t_secom_alarm GROUP BY Param")
    rows = cursor.fetchall()
    print("\n--- Unique Params in t_secom_alarm ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
