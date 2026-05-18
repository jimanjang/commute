import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    query = """
    SELECT p.Sabun, p.Name, MIN(a.ATime) AS ATime
    FROM t_secom_alarm a
    INNER JOIN t_secom_person p ON a.CardNo = p.CardNo
    WHERE a.ATime LIKE '20260518%'
    GROUP BY p.Sabun, p.Name
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    print("--- Combined Alarm & Person Result ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
