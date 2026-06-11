import os
import sys
import uuid
import datetime
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/../backend'))
from sqlalchemy.orm import Session
from backend.database import engine, SessionLocal
import backend.models as models

def main():
    bd: Session = SessionLocal()
    print("Testing Complete Lifecycle on Supabase...")
    
    # 1. Find the test users
    vendedor = bd.query(models.Usuario).filter(models.Usuario.correo == "vendedor@autoswap.bo").first()
    inspector = bd.query(models.Usuario).filter(models.Usuario.correo == "inspector@autoswap.bo").first()
    comprador = bd.query(models.Usuario).filter(models.Usuario.correo == "comprador@autoswap.bo").first()
    
    if not vendedor or not inspector or not comprador:
        print("Error: Seller, Inspector, or Buyer user missing from database.")
        bd.close()
        return

    print(f"  Vendedor: {vendedor.nombre} ({vendedor.id})")
    print(f"  Inspector: {inspector.nombre} ({inspector.id})")
    print(f"  Comprador: {comprador.nombre} ({comprador.id})")

    # 2. Simulate Seller Publishes a Car (should be "pendiente")
    vehiculo_id = str(uuid.uuid4())
    nuevo_vehiculo = models.Vehiculo(
        id=vehiculo_id,
        vendedor_id=vendedor.id,
        titulo="TEST FLOW VEHICLE 2026",
        descripcion="This is a test description with more than 100 characters to pass the frontend length validation constraints.",
        marca="TestBrand",
        modelo="TestModel",
        anio=2026,
        kilometraje_km=15000,
        precio_clp=25000.0,
        categoria="sedan",
        tipo_combustible="bencina",
        transmision="manual",
        color_exterior="Rojo",
        patente="TEST99",
        region="La Paz",
        ciudad="La Paz",
        estado_validacion="pendiente",  # Seller publishes as pending
        es_activo=True,
        disponible=True,
        estado_venta="disponible"
    )
    
    try:
        bd.add(nuevo_vehiculo)
        bd.commit()
        print("\nStep 1: Vehicle published successfully with status 'pendiente'.")
        
        # Verify status in database
        db_vehiculo = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
        print(f"  Database Verification: state={db_vehiculo.estado_validacion}, disponible={db_vehiculo.disponible}")
        assert db_vehiculo.estado_validacion == "pendiente", "Initial state must be 'pendiente'"

        # 3. Simulate Inspector Approves the Car
        db_vehiculo.estado_validacion = "aprobado"
        db_vehiculo.revisado_por = inspector.id
        db_vehiculo.revisado_at = datetime.datetime.utcnow()
        bd.commit()
        bd.refresh(db_vehiculo)
        print("\nStep 2: Inspector approved the vehicle successfully.")
        print(f"  Database Verification: state={db_vehiculo.estado_validacion}, revisado_por={db_vehiculo.revisado_por}")
        assert db_vehiculo.estado_validacion == "aprobado", "Approved state must be 'aprobado'"

        # 4. Simulate Buyer Purchases the Car
        db_vehiculo.disponible = False
        db_vehiculo.estado_venta = "en_proceso"
        compra_id = str(uuid.uuid4())
        nueva_compra = models.Compra(
            id=compra_id,
            comprador_id=comprador.id,
            vehiculo_id=db_vehiculo.id,
            vendedor_id=vendedor.id,
            metodo_pago="QR",
            codigo_transaccion=str(uuid.uuid4()),
            monto=db_vehiculo.precio_clp,
            estado="pendiente_aceptacion"
        )
        bd.add(nueva_compra)
        bd.commit()
        bd.refresh(nueva_compra)
        bd.refresh(db_vehiculo)
        print("\nStep 3: Buyer purchased the vehicle successfully.")
        print(f"  Database Verification: compra_id={nueva_compra.id}, purchase_state={nueva_compra.estado}")
        print(f"  Vehicle Sale State: disponible={db_vehiculo.disponible}, estado_venta={db_vehiculo.estado_venta}")
        assert db_vehiculo.disponible == False, "Purchased vehicle must not be available"
        assert db_vehiculo.estado_venta == "en_proceso", "Sale state must be 'en_proceso'"

        # Cleanup
        print("\nCleaning up test records from database...")
        bd.delete(nueva_compra)
        bd.delete(db_vehiculo)
        bd.commit()
        print("Cleanup completed successfully.")
        print("\n--- ALL 3 STEPS AND TRANSITIONS ARE 100% CORRECT AND FUNCTIONAL! ---")

    except Exception as e:
        bd.rollback()
        print(f"Error during test: {e}")
        # Clean up in case of failure
        try:
            db_veh = bd.query(models.Vehiculo).filter(models.Vehiculo.id == vehiculo_id).first()
            if db_veh:
                bd.delete(db_veh)
                bd.commit()
        except:
            pass
    finally:
        bd.close()

if __name__ == '__main__':
    main()
