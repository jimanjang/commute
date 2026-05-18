import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Query t_secom_trigger_log for today
    cursor.execute("SELECT id, sabun, name, email, status, created_at FROM t_secom_trigger_log WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = '2026-05-18'")
    rows = cursor.fetchall()
    print("--- Trigger Logs for Today ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
