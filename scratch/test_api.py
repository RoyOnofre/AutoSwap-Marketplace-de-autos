import requests, json

BASE_URL = "http://127.0.0.1:8004"

def test_get_usuarios():
    r = requests.get(f"{BASE_URL}/api/usuarios")
    print("GET /api/usuarios status", r.status_code)
    print("Response:", r.json())

if __name__ == "__main__":
    test_get_usuarios()
