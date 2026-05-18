import urllib.request
import json
import pymysql

try:
    print("Triggering schedule sync via Next.js API...")
    url = "http://localhost:3005/api/admin/schedule/sync"
    req = urllib.request.Request(url, method='GET')
    with urllib.request.urlopen(req) as response:
        res_data = response.read().decode('utf-8')
        print("API Response:", res_data)
        
    # Let's count them in MySQL now!
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM t_secom_schedule WHERE date = '2026-05-18'")
    print("MySQL Schedules count today:", cursor.fetchone()[0])
    
except Exception as e:
    print("Error:", str(e).encode('utf-8', errors='ignore').decode('utf-8'))
