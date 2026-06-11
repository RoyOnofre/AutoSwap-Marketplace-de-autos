import os
from sqlalchemy import create_engine
from backend.database import Base, SQLALCHEMY_DATABASE_URL

def main():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Base.metadata.create_all(engine)
    print("Supabase tables created.")

if __name__ == "__main__":
    main()
