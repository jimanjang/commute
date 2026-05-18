import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # 1. Daky (KS2508010)
    cursor.execute("SELECT email, start_time, end_time, sheet_type_description FROM t_secom_schedule WHERE email LIKE '%daky%' AND date = '2026-05-18'")
    daky = cursor.fetchall()
    print("--- Daky Schedule ---")
    print(daky)
    
    # 2. Laika (KS2602010)
    cursor.execute("SELECT email, start_time, end_time, sheet_type_description FROM t_secom_schedule WHERE email LIKE '%laika%' AND date = '2026-05-18'")
    laika = cursor.fetchall()
    print("--- Laika Schedule ---")
    print(laika)
    
except Exception as e:
    print(f"Error: {e}")
