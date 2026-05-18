import pymysql

try:
    print("Connecting to MySQL Database at 172.17.3.206...")
    conn = pymysql.connect(host='172.17.3.206', user='secom', password='secom123', db='secom')
    cursor = conn.cursor()
    
    # Drop trigger if exists
    print("Dropping existing trigger if any...")
    cursor.execute("DROP TRIGGER IF EXISTS trg_secom_alarm_to_workhistory")
    
    # Create the trigger
    print("Creating real-time commute trigger...")
    trigger_sql = """
    CREATE TRIGGER trg_secom_alarm_to_workhistory
    AFTER INSERT ON t_secom_alarm
    FOR EACH ROW
    BEGIN
        DECLARE v_sabun VARCHAR(64);
        DECLARE v_name VARCHAR(64);
        DECLARE v_card_full VARCHAR(64);
        DECLARE v_jumin VARCHAR(64);
        DECLARE v_company VARCHAR(64);
        DECLARE v_dept VARCHAR(64);
        DECLARE v_team VARCHAR(64);
        DECLARE v_part VARCHAR(64);
        DECLARE v_grade VARCHAR(64);
        DECLARE v_detail_grade VARCHAR(64);
        DECLARE v_work_date VARCHAR(8);
        DECLARE v_time VARCHAR(14);
        DECLARE v_exists INT DEFAULT 0;
        
        -- 1. Extract employee details from t_secom_person using CardNo
        SELECT Sabun, Name, CardFullData, JuminNo, Company, Department, Team, Part, Grade, DetailGrade
        INTO v_sabun, v_name, v_card_full, v_jumin, v_company, v_dept, v_team, v_part, v_grade, v_detail_grade
        FROM t_secom_person
        WHERE CardNo = NEW.CardNo
        LIMIT 1;
        
        -- 2. Extract date and time parts
        SET v_work_date = SUBSTRING(NEW.ATime, 1, 8);
        SET v_time = NEW.ATime;
        
        IF v_sabun IS NOT NULL AND v_sabun <> '' THEN
            -- 3. Check if a workhistory record already exists for today and this employee
            SELECT COUNT(*) INTO v_exists 
            FROM t_secom_workhistory 
            WHERE WorkDate = v_work_date AND Sabun = v_sabun;
            
            IF v_exists > 0 THEN
                -- Record exists: update the end time (WCTime) to the latest swipe of the day
                UPDATE t_secom_workhistory
                SET WCTime = v_time,
                    bWC = 1,
                    UpdateTime = CONCAT(CURDATE() + 0, REPLACE(CURTIME(), ':', ''))
                WHERE WorkDate = v_work_date AND Sabun = v_sabun;
            ELSE
                -- Record does not exist: insert a new check-in record (WSTime)
                INSERT INTO t_secom_workhistory (
                    WorkDate, CardNo, CardFullData, JuminNo, Name, Sabun,
                    Company, Department, Team, Part, Grade, DetailGrade,
                    bWS, bWC, WSTime, WCTime, bLate, bAbsent,
                    InsertTime
                ) VALUES (
                    v_work_date, NEW.CardNo, v_card_full, v_jumin, v_name, v_sabun,
                    v_company, v_dept, v_team, v_part, v_grade, v_detail_grade,
                    1, 0, v_time, NULL, 0, 0,
                    CONCAT(CURDATE() + 0, REPLACE(CURTIME(), ':', ''))
                );
            END IF;
        END IF;
    END;
    """
    
    cursor.execute(trigger_sql)
    conn.commit()
    print("SUCCESS: Real-time commute trigger created successfully on MySQL Database!")
    
    # Confirm
    cursor.execute("SHOW TRIGGERS LIKE 't_secom_alarm'")
    triggers = cursor.fetchall()
    print("\n--- Current Triggers ---")
    for t in triggers:
        print(f"Trigger Name: {t[0]}, Event: {t[1]}, Table: {t[2]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
