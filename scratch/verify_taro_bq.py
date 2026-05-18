from google.cloud import bigquery
import os

try:
    client = bigquery.Client.from_service_account_json('service-account.json')
    query = "SELECT Name, Sabun, WSTime, WCTime, bWC FROM `secom-data.secom.workhistory_today` WHERE Sabun = 'KS2203002'"
    query_job = client.query(query)
    results = query_job.result()
    print("--- Taro's BQ Record Verification ---")
    for row in results:
        print(f"Name: {row.Name}, Sabun: {row.Sabun}, WSTime: {row.WSTime}, WCTime: {row.WCTime}, bWC: {row.bWC}")
except Exception as e:
    print(f"Error: {e}")
