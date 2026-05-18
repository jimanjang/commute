import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("DESCRIBE t_secom_workhistory")
    print("t_secom_workhistory columns:")
    for r in cursor.fetchall():
        print(r)
        
except Exception as e:
    print("Error:", e)
