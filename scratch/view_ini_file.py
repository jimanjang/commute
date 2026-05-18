import os

file_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\Erp\\FileExport.ini"
print(f"Reading: {file_path}")

try:
    if os.path.exists(file_path):
        for encoding in ['cp949', 'euc-kr', 'utf-8', 'utf-16']:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    content = f.read()
                print(f"--- Decoded successfully with {encoding} ---")
                print(content[:3000]) # First 3000 characters
                break
            except Exception as e:
                print(f"Failed with {encoding}: {e}")
    else:
        print("File does not exist!")
except Exception as e:
    print(f"Error: {e}")
