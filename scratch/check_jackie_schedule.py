import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # 1. Get Jackie's details
    cursor.execute("SELECT Name, Sabun, Email FROM t_secom_person WHERE Name LIKE '%Jackie%'")
    person = cursor.fetchone()
    print("--- Person ---")
    print(person)
    
    if person:
        email = person[2]
        # 2. Get schedule
        cursor.execute("SELECT email, date, start_time, end_time FROM t_secom_schedule WHERE email = %s AND date = '2026-05-18'", (email,))
        schedule = cursor.fetchone()
        print("--- Schedule ---")
        print(schedule)
        
except Exception as e:
    print(f"Error: {e}")
