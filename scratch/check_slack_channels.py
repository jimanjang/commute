import pymysql

try:
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    cursor.execute("SELECT team_name, channel_id, is_active FROM t_secom_slack_channel")
    rows = cursor.fetchall()
    print("--- Active Slack Channels ---")
    for r in rows:
        print(r)
        
except Exception as e:
    print(f"Error: {e}")
