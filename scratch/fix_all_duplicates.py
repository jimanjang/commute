import pymysql
from google.cloud import bigquery
import os

try:
    # 1. Update MySQL
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Austin Oh: Set Sabun to 'KSA04031'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04031' WHERE Name LIKE 'Austin%'")
    
    # Kaya Choi: Set Sabun to 'KSA06010'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA06010' WHERE Name LIKE 'Kaya%'")
    
    # Steve Choi: Set Sabun to 'KSA04020'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04020' WHERE Name LIKE 'Steve%'")
    
    # Will Jeong: Set Sabun to 'KSA04031'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04031' WHERE Name LIKE 'Will%' AND Name NOT LIKE 'Willie%' AND Name NOT LIKE 'Willow%'")
    
    # Rhea Jeong: Set Sabun to 'KSA04032'
    cursor.execute("UPDATE t_secom_person SET Sabun = 'KSA04032' WHERE Name LIKE 'Rhea%'")
    
    conn.commit()
    print("MySQL t_secom_person Sabun cleanup completed successfully!")
    
except Exception as e:
    print("MySQL Error:", e)
    if 'conn' in locals():
        conn.rollback()

try:
    # 2. Update BigQuery
    key_path = os.path.join(os.getcwd(), 'service-account.json')
    client = bigquery.Client.from_service_account_json(key_path)
    
    # Update Austin
    client.query(
        "UPDATE `secom-data.secom.person` SET Sabun = 'KSA04031' WHERE Name LIKE 'Austin%'", 
        location='asia-northeast3'
    ).result()
    
    # Update Kaya
    client.query(
        "UPDATE `secom-data.secom.person` SET Sabun = 'KSA06010' WHERE Name LIKE 'Kaya%'", 
        location='asia-northeast3'
    ).result()
    
    # Update Steve
    client.query(
        "UPDATE `secom-data.secom.person` SET Sabun = 'KSA04020' WHERE Name LIKE 'Steve%'", 
        location='asia-northeast3'
    ).result()
    
    # Update Will
    client.query(
        "UPDATE `secom-data.secom.person` SET Sabun = 'KSA04031' WHERE Name LIKE 'Will%' AND Name NOT LIKE 'Willie%' AND Name NOT LIKE 'Willow%'", 
        location='asia-northeast3'
    ).result()
    
    # Update Rhea
    client.query(
        "UPDATE `secom-data.secom.person` SET Sabun = 'KSA04032' WHERE Name LIKE 'Rhea%'", 
        location='asia-northeast3'
    ).result()
    
    print("BigQuery person table Sabun updates completed successfully!")
    
except Exception as e:
    print("BigQuery Error:", e)
