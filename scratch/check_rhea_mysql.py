import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT Name, Sabun, Team, Department FROM t_secom_person WHERE Name LIKE 'Rhea%'")
    for r in cursor.fetchall():
        print(f"Name: {r[0]}, Sabun: {r[1]}, Team: '{r[2]}' (len: {len(r[2])}), Dept: '{r[3]}' (len: {len(r[3])})")
        
except Exception as e:
    print("Error:", e)
