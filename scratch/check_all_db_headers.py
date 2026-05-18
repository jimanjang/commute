import os

db_files = [
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Database\\Cache.DB",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Database\\CacheBase.DB",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Database\\HRData.DB",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Database\\WorkManagerAttach.DB",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\ErpSendFailDB\\ErpSendFail.DB",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\ErpSendFailDB\\ErpSendFailRetryOk.DB",
    "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\새DB\\WorkManager.DB"
]

for db in db_files:
    if os.path.exists(db):
        with open(db, 'rb') as f:
            header = f.read(16)
            print(f"\nFile: {db}")
            print(f"  Hex: {header.hex()}")
            print(f"  ASCII: {header}")
    else:
        print(f"\nFile not found: {db}")
