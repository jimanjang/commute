from google.cloud import bigquery

try:
    client = bigquery.Client.from_service_account_json('service-account.json')
    query = "SELECT COUNT(*) as cnt FROM `secom-data.secom.person` WHERE Name IS NOT NULL AND Name != '' AND WorkGroup IN ('002', '006', '007')"
    query_job = client.query(query)
    results = query_job.result()
    for row in results:
        print("Roster size:", row.cnt)
except Exception as e:
    print(f"Error: {e}")
