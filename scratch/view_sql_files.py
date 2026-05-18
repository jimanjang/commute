import os

dir_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp"
files = ["ErpAlarmRealTimeQuery.sql", "ErpAlarmRealTimeQueryMSSQL.sql"]

for f_name in files:
    file_path = os.path.join(dir_path, f_name)
    print(f"\n--- Reading {f_name} ---")
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="cp949") as f:
                content = f.read()
            print(content)
        else:
            print("File does not exist!")
    except Exception as e:
        print(f"Error: {e}")
