import psycopg2

url = "postgresql://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(url)
    cursor = conn.cursor()
    print("Altering table...")
    cursor.execute("ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS estado_venta VARCHAR DEFAULT 'disponible';")
    conn.commit()
    print("Column estado_venta added/verified successfully!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
