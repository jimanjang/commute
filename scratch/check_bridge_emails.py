import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''")
    rows = cursor.fetchall()
    print("--- Person Bridge Rows with Emails ---")
    print(f"Total: {len(rows)}")
    for r in rows[:15]:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
