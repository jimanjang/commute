import sqlite3
import os
import sys

# Resilient path finder
def find_db():
    search_dirs = [
        "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\DB",
        "C:\\"
    ]
    for search_dir in search_dirs:
        if not os.path.exists(search_dir):
            continue
        for root, dirs, files in os.walk(search_dir):
            for file in files:
                if file.lower() == 'workmanager.db':
                    db_path = os.path.join(root, file)
                    print(f"Found database at: {db_path}")
                    return db_path
    return None

db_path = find_db()
if not db_path:
    print("Error: Could not find WorkManager.DB automatically.")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]

print("\n=== Tables in WorkManager.DB ===")
print(", ".join(tables))

interesting_keywords = ['erp', 'link', 'query', 'schedule', 'time', 'send', 'option', 'setting']
interesting_tables = [t for t in tables if any(k in t.lower() for k in interesting_keywords)]

print("\n=== Interesting Tables ===")
print(interesting_tables)

def query_table(table_name):
    print(f"\n--- Schema of {table_name} ---")
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        cols = cursor.fetchall()
        for col in cols:
            print(f"  {col[1]} ({col[2]})")
            
        print(f"--- Content of {table_name} (max 20 rows) ---")
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 20")
        rows = cursor.fetchall()
        for r in rows:
            print(r)
    except Exception as e:
        print(f"Error querying table {table_name}: {e}")

for tbl in interesting_tables:
    query_table(tbl)

conn.close()
