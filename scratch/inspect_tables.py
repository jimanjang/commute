import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Inspect t_secom_alarm columns
    cursor.execute("DESCRIBE t_secom_alarm")
    print("--- t_secom_alarm columns ---")
    for r in cursor.fetchall():
        print(f"  {r[0]} ({r[1]})")
        
    # Inspect t_secom_workhistory columns
    cursor.execute("DESCRIBE t_secom_workhistory")
    print("\n--- t_secom_workhistory columns ---")
    for r in cursor.fetchall():
        print(f"  {r[0]} ({r[1]})")
        
except Exception as e:
    print(f"Error: {e}")
