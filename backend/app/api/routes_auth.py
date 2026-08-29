from fastapi import APIRouter

router = APIRouter()

@router.get("/me", summary="Get Current Logged-in Doctor Profile")
async def get_doctor_profile():
    return {
        "name": "Dr. Sharma",
        "email": "dr.sharma@heal6.health",
        "role": "Consultant Endocrinologist & DFU Specialist",
        "department": "Endocrinology & Diabetic Foot Unit"
    }
