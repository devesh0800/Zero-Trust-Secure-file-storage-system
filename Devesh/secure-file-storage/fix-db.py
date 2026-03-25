import sqlite3
import os

db_path = 'c:/Users/DEVESH/Desktop/Devesh/Devesh/secure-file-storage/database.sqlite'

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'username' not in columns:
        print("Adding 'username' column to 'users' table...")
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
        conn.commit()
        print("✓ Column added successfully")
    else:
        print("✓ 'username' column already exists")
        
    conn.close()
except Exception as e:
    print(f"Error updating database: {e}")
    exit(1)
