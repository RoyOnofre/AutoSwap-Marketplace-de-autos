import psycopg2

url = "postgresql://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(url)
    cursor = conn.cursor()
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'compras';")
    rows = cursor.fetchall()
    print("Columns in table 'compras':")
    for r in rows:
        print(r[0])
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
