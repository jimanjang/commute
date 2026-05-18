import pymysql

try:
    print("Connecting to MySQL Database...")
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    print("Attempting to set log_bin_trust_function_creators globally...")
    cursor.execute("SET GLOBAL log_bin_trust_function_creators = 1;")
    conn.commit()
    print("SUCCESS globally!")
    
except Exception as e:
    print(f"Global set failed: {e}")
    try:
        print("Attempting to set session log_bin_trust_function_creators...")
        cursor.execute("SET log_bin_trust_function_creators = 1;")
        conn.commit()
        print("SUCCESS in session!")
    except Exception as e2:
        print(f"Session set failed: {e2}")
