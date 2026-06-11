import os, sqlite3, json

def main():
    db_path = os.path.abspath('techstore.db')
    print('DB path:', db_path)
    if not os.path.exists(db_path):
        print('ERROR: techstore.db not found')
        return
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cur.fetchall()]
    print('Tables:', json.dumps(tables))
    # Show column info for each table
    for tbl in tables:
        cur.execute(f"PRAGMA table_info({tbl})")
        cols = cur.fetchall()
        print(f'--- {tbl} ---')
        for col in cols:
            # cid, name, type, notnull, dflt_value, pk
            print(f"{col[1]} ({col[2]})")
    conn.close()

if __name__ == '__main__':
    main()
