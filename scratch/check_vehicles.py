import os
import sys
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))
from sqlalchemy import text
from backend.database import engine

def main():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, titulo, marca, modelo, estado_validacion, es_activo, disponible, estado_venta, vendedor_id FROM vehiculos"))
        rows = result.fetchall()
        print(f"Total vehicles: {len(rows)}")
        for r in rows:
            print(f"ID: {r[0]} | Title: {r[1]} | Brand/Model: {r[2]} {r[3]} | Status: {r[4]} | Active: {r[5]} | Available: {r[6]} | Sale State: {r[7]} | Seller ID: {r[8]}")

if __name__ == '__main__':
    main()
