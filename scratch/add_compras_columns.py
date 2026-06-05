import psycopg2

url = "postgresql://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(url)
    cursor = conn.cursor()
    print("Altering table compras...")
    cursor.execute("ALTER TABLE compras ADD COLUMN IF NOT EXISTS estado VARCHAR DEFAULT 'pendiente_aceptacion';")
    cursor.execute("ALTER TABLE compras ADD COLUMN IF NOT EXISTS motivo_rechazo VARCHAR;")
    conn.commit()
    print("Columns estado and motivo_rechazo added/verified successfully!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
