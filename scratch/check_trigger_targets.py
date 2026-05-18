import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Check trigger targets for trigger_id = 7
    cursor.execute("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = 7")
    rows = cursor.fetchall()
    print("--- Targets for Trigger 7 ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
