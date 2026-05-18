import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT sheet_type, sheet_type_description FROM t_secom_schedule")
    rows = cursor.fetchall()
    print("--- Sheet Types in t_secom_schedule ---")
    for r in rows:
        # decode korean if needed
        desc = r[1]
        try:
            desc_decoded = desc.decode('utf-8')
        except:
            try:
                desc_decoded = desc.decode('cp949')
            except:
                desc_decoded = str(desc)
        print(f"Type: {r[0]}, Desc: {desc_decoded}")
        
except Exception as e:
    print(f"Error: {e}")
