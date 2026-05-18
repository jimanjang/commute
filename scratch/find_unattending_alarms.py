import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Find all alarms today and check if they have workhistory records
    cursor.execute("""
        SELECT DISTINCT a.CardNo, p.Name, p.Sabun, a.ATime 
        FROM t_secom_alarm a
        INNER JOIN t_secom_person p ON a.CardNo = p.CardNo
        WHERE a.ATime LIKE '20260518%'
    """)
    alarms = cursor.fetchall()
    
    print("--- Checking Alarm vs Workhistory ---")
    for card, name, sabun, atime in alarms:
        cursor.execute("SELECT WSTime FROM t_secom_workhistory WHERE WorkDate = '20260518' AND Sabun = %s", (sabun,))
        work = cursor.fetchone()
        wstime = work[0] if work else None
        
        print(f"Name: {name} ({sabun})")
        print(f"  Alarm Tag Time: {atime}")
        print(f"  WorkHistory WSTime: {wstime}")
        
except Exception as e:
    print(f"Error: {e}")
