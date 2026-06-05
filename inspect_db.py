import sqlite3, json, os, sys

db_path = r'C:/praticas-tareas/TechStore-Manager/TechStore-Manager-/backend/techstore.db'
if not os.path.exists(db_path):
    print('Database file not found')
    sys.exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cur.fetchall()]
print(json.dumps(tables, ensure_ascii=False))
conn.close()
