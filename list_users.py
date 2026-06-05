import sqlite3, json, os

db_path = r'C:/praticas-tareas/TechStore-Manager/TechStore-Manager-/backend/techstore.db'
if not os.path.exists(db_path):
    print('Database not found')
    exit(1)
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute('SELECT id, correo, contrasena FROM usuarios')
rows = cur.fetchall()
print(json.dumps(rows, ensure_ascii=False))
