import os
import sys
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/../backend'))
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from main import registrar_vehiculo, CrearVehiculoPydantic

def main():
    bd: Session = SessionLocal()
    
    # Get a seller user
    vendedor = bd.query(models.Usuario).filter(models.Usuario.correo == "vendedor@autoswap.bo").first()
    if not vendedor:
        print("Seller not found")
        bd.close()
        return

    # Mock request payload
    datos = CrearVehiculoPydantic(
        titulo="Test Status Pending 2026",
        descripcion="Checking if the vehicle is created with status pending to satisfy the new workflow logic.",
        marca="TestBrand",
        modelo="TestModel",
        anio=2026,
        kilometraje_km=10000,
        precio_clp=20000.0,
        categoria="sedan",
        tipo_combustible="bencina",
        transmision="manual",
        color_exterior="Blanco",
        patente="PEND99",
        region="La Paz",
        ciudad="La Paz",
        fotos=[],
        caracteristicas=[]
    )

    try:
        # Call the endpoint function directly
        res = registrar_vehiculo(datos, vendedor, bd)
        vehiculo_id = res.get("id")
        print(f"Vehicle registered through endpoint function. ID: {vehiculo_id}")

        # Check status in database
        db_vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
        print(f"Verification: estado_validacion in DB is '{db_vehiculo.estado_validacion}'")
        
        # Cleanup
        bd.delete(db_vehiculo)
        bd.commit()
        print("Cleanup done.")
        
    except Exception as e:
        bd.rollback()
        print(f"Error: {e}")
    finally:
        bd.close()

if __name__ == '__main__':
    main()
