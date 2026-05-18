import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Let's align t_secom_workhistory Sabun values with current t_secom_person Sabun values by matching CardNo for today
    print("Aligning today's workhistory Sabuns with person master database...")
    
    cursor.execute("""
        UPDATE t_secom_workhistory w
        INNER JOIN t_secom_person p ON w.CardNo = p.CardNo
        SET w.Sabun = p.Sabun
        WHERE w.WorkDate = '20260518'
    """)
    print(f"Successfully aligned today's workhistory Sabuns! Rows affected: {cursor.rowcount}")
    conn.commit()
    
except Exception as e:
    print("Error:", e)
    if 'conn' in locals():
        conn.rollback()
