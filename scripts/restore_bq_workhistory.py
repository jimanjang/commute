import pymysql
import pandas as pd
import pandas_gbq
from google.oauth2 import service_account
from sqlalchemy import create_engine
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_PATH = os.path.join(BASE_DIR, "service-account.json")

if not os.path.exists(KEY_PATH):
    KEY_PATH = os.path.join(BASE_DIR, "secom-bigquery-key.json")

try:
    credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
except Exception as e:
    print(f"Error loading credentials: {e}")
    credentials = None

engine = create_engine("mysql+pymysql://secom:secom123@172.17.3.206/secom?charset=utf8")

def restore():
    try:
        # Fetch all workhistory records from MySQL
        print("Fetching all workhistory records from MySQL...")
        df = pd.read_sql("SELECT * FROM t_secom_workhistory", engine)
        
        if df.empty:
            print("MySQL t_secom_workhistory is empty. Nothing to restore.")
            return

        print(f"Read {len(df)} rows from MySQL. Uploading to BigQuery secom-data.secom.workhistory...")
        
        # Convert all columns to string for consistency
        df_str = df.astype(str)
        
        pandas_gbq.to_gbq(
            df_str,
            destination_table="secom.workhistory",
            project_id="secom-data",
            if_exists="replace", # Use replace to create the table cleanly with all data
            credentials=credentials
        )
        
        print("[SUCCESS] BigQuery secom-data.secom.workhistory has been successfully recreated and populated!")
    except Exception as e:
        print(f"[ERROR] Error during restore: {e}")

if __name__ == "__main__":
    restore()
