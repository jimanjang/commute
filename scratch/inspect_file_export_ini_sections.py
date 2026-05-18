import os
import configparser

ini_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp\\FileExport.ini"

if not os.path.exists(ini_path):
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "FileExport.ini" in files:
            ini_path = os.path.join(root, "FileExport.ini")
            break

print(f"Parsing FileExport.ini: {ini_path}")

try:
    config = configparser.ConfigParser()
    config.read(ini_path, encoding='cp949')
    
    for section in config.sections():
        print(f"\n[{section}]")
        for key in config[section]:
            val = config[section][key]
            # If the value is long, truncate it
            if len(val) > 100:
                val = val[:100] + "... (truncated)"
            print(f"  {key} = {val}")
            
except Exception as e:
    print(f"Error: {e}")
