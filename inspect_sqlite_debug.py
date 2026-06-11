import os, sqlite3, json, sys

def main():
    db_path = os.path.abspath('techstore.db')
    print('SQLite DB path:', db_path)
    if not os.path.exists(db_path):
        print('ERROR: techstore.db not found')
        sys.exit(1)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cur.fetchall()]
    print('Tables found:', tables)
    for tbl in tables:
        cur.execute(f"SELECT COUNT(*) FROM {tbl}")
        cnt = cur.fetchone()[0]
        print(f'  {tbl}: {cnt} rows')
        # Show first few rows for debugging
        cur.execute(f"SELECT * FROM {tbl} LIMIT 5")
        rows = cur.fetchall()
        print(f'    Sample rows: {rows}')
    conn.close()

if __name__ == '__main__':
    main()
