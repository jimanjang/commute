from google.cloud import bigquery
import os

key_path = os.path.join(os.getcwd(), 'service-account.json')
client = bigquery.Client.from_service_account_json(key_path)

# Let's run a test query to find duplicate Sabuns in BigQuery person table
query_dups = """
    SELECT Sabun, COUNT(*) as cnt 
    FROM `secom-data.secom.person` 
    WHERE Sabun IS NOT NULL AND Sabun != ''
    GROUP BY Sabun 
    HAVING cnt > 1
"""
print("Duplicate Sabuns in BQ:")
for r in client.query(query_dups, location='asia-northeast3'):
    print(r)

# Let's run a test query to find duplicate Names in BigQuery person table
query_names = """
    SELECT Name, COUNT(*) as cnt 
    FROM `secom-data.secom.person` 
    GROUP BY Name 
    HAVING cnt > 1
"""
print("\nDuplicate Names in BQ:")
for r in client.query(query_names, location='asia-northeast3'):
    print(r)
