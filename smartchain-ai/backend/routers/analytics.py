from fastapi import APIRouter

# ------------------------------------------------------------------------------
# ANALYTICS ROUTER
# ------------------------------------------------------------------------------
# This router handles supply chain analytics dashboard data, including predictions,
# delay probabilities, and historical performance charts.

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

# Example endpoint placeholder:
# @router.get("/summary")
# def get_analytics_summary():
#     return {"total_delayed": 0, "on_time_ratio": 1.0}
