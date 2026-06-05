import psycopg2
import sys

urls = [
    "postgresql://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.co:5432/postgres",
    "postgresql://postgres.eiwmwozjquranqqniwrp:5jwyfwos0209@aws-0-us-west-2.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:5jwyfwos0209@db.eiwmwozjquranqqniwrp.supabase.com:5432/postgres"
]

for url in urls:
    print(f"Testing connection to: {url}")
    try:
        conn = psycopg2.connect(url)
        print("SUCCESS!")
        conn.close()
    except Exception as e:
        print(f"FAILED: {e}")
