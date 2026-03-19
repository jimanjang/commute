import pymysql
import pandas as pd
import pandas_gbq  # pip install pandas-gbq 필수
from google.oauth2 import service_account
import datetime
import time
from sqlalchemy import create_engine
import os

# ==========================================
# 1. 설정 및 인증 (Key 파일 경로 확인!)
# ==========================================
# Use the service-account.json from the project root if available
# The script is in /scripts/, so ../service-account.json
# or just service-account.json if run from project root.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_PATH = os.path.join(BASE_DIR, "service-account.json")

if not os.path.exists(KEY_PATH):
    print(f"! Key file not found at {KEY_PATH}, falling back to secom-bigquery-key.json")
    KEY_PATH = "secom-bigquery-key.json"

try:
    credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
except Exception as e:
    print(f"! Error loading credentials: {e}")
    # Fallback to default credentials or let it fail if it doesn't exist
    credentials = None

# MySQL 연결 설정
engine = create_engine("mysql+pymysql://secom:secom123@172.17.3.206/secom?charset=utf8")

# 과거 데이터 전송 기록 파일
SYNC_FILE = os.path.join(BASE_DIR, "archive_sync_time.txt")

def get_last_sync():
    try:
        with open(SYNC_FILE, "r") as f: return f.read().strip()
    except: return "0"

def save_last_sync(val):
    try:
        with open(SYNC_FILE, "w") as f: f.write(str(val))
    except Exception as e:
        print(f":x: Error saving sync status: {e}")

# ==========================================
# 2. 메인 동기화 함수 (하이브리드 방식)
# ==========================================
def sync_job():
    try:
        now = datetime.datetime.now()
        today_str = now.strftime('%Y%m%d')
        last_archive_time = get_last_sync()

        print(f"\n[실행 시각: {now.strftime('%Y-%m-%d %H:%M:%S')}]")

        # 쿼리: 오늘 데이터 전체 + 아직 아카이브 안 된 과거 데이터
        query = f"""
        SELECT * FROM t_secom_workhistory
        WHERE (WorkDate = '{today_str}')
           OR (InsertTime > '{last_archive_time}' AND WorkDate < '{today_str}')
        ORDER BY InsertTime ASC
        """
        df = pd.read_sql(query, engine)

        if not df.empty:
            df_today = df[df['WorkDate'] == today_str]
            df_archive = df[df['WorkDate'] < today_str]

            # 1. 과거 데이터 아카이브 (어제 이전 데이터가 새로 발견될 때만)
            if not df_archive.empty:
                print(f":package: 과거 데이터 {len(df_archive)}건 아카이브 중...")
                pandas_gbq.to_gbq(
                    df_archive.astype(str),
                    destination_table="secom.workhistory",
                    project_id="secom-data",
                    if_exists="append",
                    credentials=credentials
                )
                save_last_sync(df_archive['InsertTime'].max())

            # 2. 오늘 데이터 실시간 업데이트 (무조건 덮어쓰기하여 수정 반영)
            if not df_today.empty:
                print(f":zap: 오늘 데이터 {len(df_today)}건 실시간 업데이트 중...")
                pandas_gbq.to_gbq(
                    df_today.astype(str),
                    destination_table="secom.workhistory_today",
                    project_id="secom-data",
                    if_exists="replace",
                    credentials=credentials
                )

            print(f":white_check_mark: 동기화 완료!")
        else:
            print(f":information_source: {today_str}일자 변동사항 없음")

    except Exception as e:
        print(f":x: 오류 발생: {e}")

# ==========================================
# 3. 무한 루프 실행
# ==========================================
if __name__ == "__main__":
    print(":rocket: [SECOM -> BigQuery] 실시간 동기화 프로세스 가동")
    print(":bulb: 방식: 오늘 데이터는 실시간 수정(Replace), 과거 데이터는 누적(Archive)")

    while True:
        sync_job()

        # 주기 설정: 20초 (MySQL 부하와 실시간성 사이의 적정치)
        SLEEP_SECONDS = 20
        print(f":zzz: {SLEEP_SECONDS}초 대기 중...")
        time.sleep(SLEEP_SECONDS)
