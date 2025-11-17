from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession


from app.services import promo_service 
from app.schemas.promo import PromoRequest, PromoResponse
from app.core.dependencies import get_db, get_current_user
from app.schemas import user as user_schema

router = APIRouter()

@router.post("/generate", response_model=PromoResponse)
async def generate_promo(
    request: PromoRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: user_schema.User = Depends(get_current_user)
):
    try:

        results = await promo_service.generate_promo_logic(
            request=request, 
            db=db, 
            user_id=current_user.id
        )
        return PromoResponse(results=results)
    except Exception as e:

        raise HTTPException(status_code=500, detail=f"A critical backend error occurred: {str(e)}")
