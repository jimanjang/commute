from google.cloud import bigquery
import os

try:
    key_path = os.path.join(os.getcwd(), 'service-account.json')
    client = bigquery.Client.from_service_account_json(key_path)
    
    query = """
        SELECT Team, COUNT(*) as cnt 
        FROM `secom-data.secom.person` 
        GROUP BY Team
    """
    query_job = client.query(query, location='asia-northeast3')
    print("BigQuery person table Teams:")
    for row in query_job:
        print(f"  Team: '{row.Team}', Count: {row.cnt}")
        
except Exception as e:
    print("Error:", e)
