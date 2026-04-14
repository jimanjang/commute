import pymysql

try:
    conn = pymysql.connect(
        host='172.17.3.206',
        user='secom',
        password='secom123',
        db='secom',
        charset='utf8mb4'
    )
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    # Search for "tombo" in the t_secom_person table
    search_term = "%tombo%"
    print(f"Searching for Name matching {search_term} in t_secom_person")
    cursor.execute("SELECT Name FROM t_secom_person WHERE Name LIKE %s", (search_term,))
    rows = cursor.fetchall()
    print("Matches:", rows)
    
    conn.close()
except Exception as e:
    print("Error:", e)
