import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT a.ATime, p.Name, p.Sabun, p.Email 
        FROM t_secom_alarm a 
        INNER JOIN t_secom_person p ON a.CardNo = p.CardNo 
        WHERE a.ATime LIKE '20260518%' AND p.Sabun = 'KS2512012'
        ORDER BY a.ATime ASC
    """)
    rows = cursor.fetchall()
    print("--- Heather Alarms Today ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
