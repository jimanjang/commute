import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM t_secom_schedule WHERE email = 'jackie.hwang@daangnservice.com' AND date = '2026-05-18'")
    rows = cursor.fetchall()
    
    # Get column names
    cursor.execute("DESCRIBE t_secom_schedule")
    columns = [c[0] for c in cursor.fetchall()]
    
    print("--- Jackie Schedule Details ---")
    for r in rows:
        row_dict = dict(zip(columns, r))
        for k, v in row_dict.items():
            print(f"{k}: {v}")
            
except Exception as e:
    print(f"Error: {e}")
