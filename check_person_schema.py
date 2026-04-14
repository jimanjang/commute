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
    
    # Check t_secom_person columns
    cursor.execute("DESC t_secom_person")
    columns = cursor.fetchall()
    print("t_secom_person columns:")
    for col in columns:
        print(col)
    
    conn.close()
except Exception as e:
    print("Error:", e)
