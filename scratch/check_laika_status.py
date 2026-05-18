import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Check t_secom_alarm for today
    cursor.execute("SELECT ATime, InsertTime FROM t_secom_alarm WHERE CardNo = '0109338254950' AND ATime LIKE '20260518%' ORDER BY ATime DESC")
    alarms = cursor.fetchall()
    print("--- today's alarms for Laika ---")
    for a in alarms:
        print(f"  ATime: {a[0]}, DB InsertTime: {a[1]}")
        
    # Check t_secom_workhistory for today
    cursor.execute("SELECT WorkDate, Sabun, WSTime, WCTime, InsertTime, UpdateTime FROM t_secom_workhistory WHERE Sabun = 'KS2602010' AND WorkDate = '20260518'")
    history = cursor.fetchall()
    print("\n--- today's workhistory for Laika ---")
    for h in history:
        print(f"  WorkDate: {h[0]}, Sabun: {h[1]}, WSTime: {h[2]}, WCTime: {h[3]}, DB InsertTime: {h[4]}, DB UpdateTime: {h[5]}")
        
except Exception as e:
    print(f"Error: {e}")
