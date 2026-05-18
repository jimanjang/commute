import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # 1. Austin: Keep only 1 row, delete duplicates, set Sabun to 'KSA04031'
    cursor.execute("SELECT id FROM t_secom_person WHERE Name LIKE 'Austin%'")
    austin_ids = [r[0] for r in cursor.fetchall()]
    if len(austin_ids) > 1:
        print(f"Cleaning duplicate Austin records (found {len(austin_ids)}). Keeping ID {austin_ids[0]}.")
        for extra_id in austin_ids[1:]:
            cursor.execute("DELETE FROM t_secom_person WHERE id = %s", (extra_id,))
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04031' WHERE Name LIKE 'Austin%'")
    
    # 2. Kaya: Set Sabun to 'KSA06010'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA06010' WHERE Name LIKE 'Kaya%'")
    
    # 3. Steve: Set Sabun to 'KSA04020'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04020' WHERE Name LIKE 'Steve%'")
    
    # 4. Will: Set Sabun to 'KSA04031'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04031' WHERE Name LIKE 'Will%' AND Name NOT LIKE 'Willie%' AND Name NOT LIKE 'Willow%'")
    
    # 5. Rhea: Set Sabun to 'KSA04032'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04032' WHERE Name LIKE 'Rhea%'")
    
    conn.commit()
    print("MySQL t_secom_person Sabun cleanup completed successfully!")
    
except Exception as e:
    print("Error:", e)
    conn.rollback()
