import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # 1. Check person table teams
    cursor.execute("SELECT Team, COUNT(*) FROM t_secom_person GROUP BY Team")
    print("t_secom_person Teams:")
    for r in cursor.fetchall():
        print(f"  Team: '{r[0]}', Count: {r[1]}")
        
    # 2. Check workhistory table teams for today
    cursor.execute("SELECT Team, COUNT(*) FROM t_secom_workhistory WHERE WorkDate = '20260518' GROUP BY Team")
    print("\nt_secom_workhistory Teams today:")
    for r in cursor.fetchall():
        print(f"  Team: '{r[0]}', Count: {r[1]}")
        
    # 3. Check some sample rows from t_secom_person
    cursor.execute("SELECT Name, Sabun, Department, Team FROM t_secom_person LIMIT 5")
    print("\nt_secom_person Samples:")
    for r in cursor.fetchall():
        print(r)
        
except Exception as e:
    print("Error:", e)
