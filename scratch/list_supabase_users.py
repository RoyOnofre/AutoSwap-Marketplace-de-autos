import os
import sys
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))
from sqlalchemy import text
from backend.database import engine

def main():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre, correo, rol FROM usuarios"))
        rows = result.fetchall()
        print(f"Total users: {len(rows)}")
        for r in rows:
            print(f"ID: {r[0]} | Name: {r[1]} | Email: {r[2]} | Role: {r[3]}")

if __name__ == '__main__':
    main()
