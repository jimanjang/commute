import os

dir_path = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1"
print(f"Listing files in: {dir_path}")

try:
    if os.path.exists(dir_path):
        for root, dirs, files in os.walk(dir_path):
            # Only list top-level files and directories to avoid too much output
            print(f"\n[Root]: {root}")
            print("Directories:")
            for d in dirs[:10]:
                print(f"  {d}/")
            if len(dirs) > 10:
                print(f"  ... and {len(dirs) - 10} more directories")
            print("Files:")
            for f in files[:30]:
                print(f"  {f} ({os.path.getsize(os.path.join(root, f))} bytes)")
            if len(files) > 30:
                print(f"  ... and {len(files) - 30} more files")
            # Break so we only do top-level walking
            break
    else:
        print("Directory does not exist!")
except Exception as e:
    print(f"Error: {e}")
