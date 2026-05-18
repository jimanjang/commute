import subprocess

try:
    print("--- Searching Windows Services for S1/Secom ---")
    output = subprocess.check_output("powershell -Command \"Get-Service | Where-Object { $_.DisplayName -like '*s1*' -or $_.Name -like '*s1*' -or $_.DisplayName -like '*secom*' -or $_.Name -like '*secom*' -or $_.Name -like '*work*' }\"", shell=True).decode('utf-8', errors='ignore')
    print(output)
except Exception as e:
    print(f"Error: {e}")
