import pymysql
import os

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Let's mock the sync logic in python to see what we are sending
    cursor.execute("SELECT Name, Email, Sabun, Team FROM t_secom_person")
    person_rows = cursor.fetchall()
    
    # Mock getGwsUserMap
    # Let's load the actual GWS map using the JS-like retrieval
    # For now, let's see which sabuns are duplicate in the database
    sabun_counts = {}
    for r in person_rows:
        sabun = r[2]
        if sabun:
            sabun = sabun.strip()
            sabun_counts[sabun] = sabun_counts.get(sabun, 0) + 1
            
    print("Duplicate Sabuns in MySQL t_secom_person:")
    for s, c in sabun_counts.items():
        if c > 1:
            print(f"  Sabun: '{s}', Count: {c}")
            
except Exception as e:
    print("Error:", e)
