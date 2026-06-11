import os, json
from sqlalchemy import create_engine, inspect
from backend.database import engine

def main():
    insp = inspect(engine)
    tables = insp.get_table_names()
    print('Supabase tables:', tables)
    with engine.connect() as conn:
        for tbl in tables:
            result = conn.execute(text(f'SELECT COUNT(*) FROM {tbl}'))
            count = result.fetchone()[0]
            print(f'  {tbl}: {count} rows')
    
if __name__ == '__main__':
    main()
