import psycopg2

url = "postgresql://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(url)
    cursor = conn.cursor()
    cursor.execute("SELECT id, titulo, es_activo, estado_validacion, vendedor_id FROM vehiculos;")
    rows = cursor.fetchall()
    print(f"Total vehicles: {len(rows)}")
    for r in rows:
        print(f"ID: {r[0]} | Title: {r[1]} | Active: {r[2]} | Validacion: {r[3]} | Vendedor: {r[4]}")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
