import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import jwt

app = FastAPI(
    title="AutoSwap Offers Service",
    version="1.0.0",
    openapi_tags=[{"name": "offers", "description": "Endpoints para gestión de ofertas"}],
)

# ---------------------------------------------------
# Seguridad: JWT simple con la clave pública de Supabase
# ---------------------------------------------------
security = HTTPBearer()

SUPABASE_PUBLIC_KEY = os.getenv("SUPABASE_PUBLIC_KEY", "")
if not SUPABASE_PUBLIC_KEY:
    # En desarrollo usamos una clave dummy
    SUPABASE_PUBLIC_KEY = "dummy_public_key"

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SUPABASE_PUBLIC_KEY, algorithms=["HS256", "RS256"], options={"verify_aud": False})
        return payload
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ---------------------------------------------------
# Modelos y Schemas
# ---------------------------------------------------
class OfferCreate(BaseModel):
    product_id: str = Field(..., description="ID del producto ofertado")
    price: int = Field(..., description="Precio en pesos (CLP)")
    description: Optional[str] = Field(None, description="Descripción opcional")

class OfferResponse(BaseModel):
    id: str
    product_id: str
    price: int
    description: Optional[str] = None
    created_by: str

# ---------------------------------------------------
# In‑memory storage (para demo)
# ---------------------------------------------------
offers_db: List[OfferResponse] = []

# ---------------------------------------------------
# Endpoints
# ---------------------------------------------------
@app.post("/offers", response_model=OfferResponse, tags=["offers"], status_code=status.HTTP_201_CREATED)
def create_offer(dto: OfferCreate, user: dict = Depends(verify_jwt)):
    new_id = f"offer_{len(offers_db)+1}"
    offer = OfferResponse(
        id=new_id,
        product_id=dto.product_id,
        price=dto.price,
        description=dto.description,
        created_by=user.get("sub", "anonymous"),
    )
    offers_db.append(offer)
    return offer

@app.get("/offers/{offer_id}", response_model=OfferResponse, tags=["offers"])
def get_offer(offer_id: str, user: dict = Depends(verify_jwt)):
    for o in offers_db:
        if o.id == offer_id:
            return o
    raise HTTPException(status_code=404, detail="Offer not found")

@app.patch("/offers/{offer_id}", response_model=OfferResponse, tags=["offers"])
def update_offer(offer_id: str, dto: OfferCreate, user: dict = Depends(verify_jwt)):
    for idx, o in enumerate(offers_db):
        if o.id == offer_id:
            if o.created_by != user.get("sub"):
                raise HTTPException(status_code=403, detail="Forbidden")
            updated = o.copy(update={
                "product_id": dto.product_id,
                "price": dto.price,
                "description": dto.description,
            })
            offers_db[idx] = updated
            return updated
    raise HTTPException(status_code=404, detail="Offer not found")

@app.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["offers"])
def delete_offer(offer_id: str, user: dict = Depends(verify_jwt)):
    for idx, o in enumerate(offers_db):
        if o.id == offer_id:
            if o.created_by != user.get("sub"):
                raise HTTPException(status_code=403, detail="Forbidden")
            offers_db.pop(idx)
            return
    raise HTTPException(status_code=404, detail="Offer not found")

if __name__ == "__main__":
    uvicorn.run("offers_service.main:app", host="0.0.0.0", port=8001, reload=True)
