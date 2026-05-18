import os

ini_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp\\FileExport.ini"

if not os.path.exists(ini_path):
    # Try finding dynamically
    for root, dirs, files in os.walk("C:\\"):
        if "세콤매니저" in root and "FileExport.ini" in files:
            ini_path = os.path.join(root, "FileExport.ini")
            break

print(f"Reading FileExport.ini from: {ini_path}")

try:
    # Try multiple encodings
    for encoding in ['utf-8', 'cp949', 'euc-kr', 'ansi']:
        try:
            with open(ini_path, 'r', encoding=encoding) as f:
                content = f.read()
                print(f"--- Encoding {encoding} ---")
                print(content[:5000]) # Print first 5000 characters
                break
        except Exception:
            continue
except Exception as e:
    print(f"Error reading FileExport.ini: {e}")
