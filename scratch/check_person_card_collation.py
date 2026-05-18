import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SHOW CREATE TABLE t_secom_person")
    print("--- t_secom_person schema ---")
    print(cursor.fetchone()[1])
    
    cursor.execute("SHOW CREATE TABLE t_secom_alarm")
    print("\n--- t_secom_alarm schema ---")
    print(cursor.fetchone()[1])
    
except Exception as e:
    print(f"Error: {e}")
