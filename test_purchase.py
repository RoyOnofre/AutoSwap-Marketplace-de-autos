import requests, json, os

BASE_URL = os.getenv('VITE_API_URL') or 'http://localhost:8005/api'

def login(correo, contrasena):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"correo": correo, "contrasena": contrasena})
    resp.raise_for_status()
    data = resp.json()
    token = data.get('token')
    print('Login token:', token)
    return token

def get_vehicles(token):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    resp = requests.get(f"{BASE_URL}/vehiculos", headers=headers)
    resp.raise_for_status()
    vehicles = resp.json()
    print('Vehicles:', vehicles[:2])
    return vehicles

def purchase(token, vehiculo_id):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    resp = requests.post(f"{BASE_URL}/transacciones/comprar/{vehiculo_id}", headers=headers)
    print('Purchase status:', resp.status_code)
    try:
        print('Response:', resp.json())
    except Exception:
        print('Response text:', resp.text)

if __name__ == '__main__':
    token = login('admin@autoswap.bo', 'admin123')
    vehicles = get_vehicles(token)
    if vehicles:
        purchase(token, vehicles[0]['id'])
    else:
        print('No vehicles found')
