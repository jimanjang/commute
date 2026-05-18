from google.oauth2 import service_account
from google.cloud import bigquery

KEY_PATH = "secom-bigquery-key.json"
credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
client = bigquery.Client(credentials=credentials, project="secom-data")

query = "SELECT Name, Sabun, Team, WorkGroup FROM `secom-data.secom.person` WHERE Name LIKE '%Laika%' OR Name LIKE '%라이카%'"
query_job = client.query(query)
results = query_job.result()

print("--- BigQuery Laika Record ---")
for row in results:
    print(dict(row))
