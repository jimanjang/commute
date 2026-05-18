import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    names = ['Jade', 'Taro', 'Lyla', 'Jackie']
    for name in names:
        cursor.execute("SELECT email, start_time, end_time, sheet_type_description FROM t_secom_schedule WHERE email LIKE %s AND date = '2026-05-18'", (f"%{name.lower()}%",))
        rows = cursor.fetchall()
        print(f"--- {name} Schedule ---")
        print(rows)
        
except Exception as e:
    print(f"Error: {e}")
