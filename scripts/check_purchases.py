import os
import sys
# Ensure project root is in PYTHONPATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.append(project_root)

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from backend.models import Compra
from backend.database import SQLALCHEMY_DATABASE_URL

def main():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with Session(engine) as session:
        pending = session.execute(select(Compra).where(Compra.estado == 'pendiente_aceptacion')).scalars().all()
        print('Pending purchases count:', len(pending))
        for p in pending:
            print('ID:', p.id, 'Estado:', p.estado)

if __name__ == '__main__':
    main()
