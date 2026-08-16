from fastapi import APIRouter
from pydantic import BaseModel
from core.route_engine import RouteEngine

# ------------------------------------------------------------------------------
# ROUTING ROUTER
# ------------------------------------------------------------------------------
# This router handles transit routing, mapping nodes, path optimization algorithms
# (e.g. Dijkstra or A* on supply chain graphs), and rerouting suggestions.

router = APIRouter(
    prefix="/routing",
    tags=["Routing"]
)

# Initialize Route Engine
route_engine = RouteEngine()

# Dummy region risk scores for the graph (can be fetched from DB in production)
MOCK_REGION_RISKS = {
    "Mumbai": 15,
    "Delhi": 85,
    "Hyderabad": 10,
    "Kolkata": 40,
    "Chennai": 20,
    "Bengaluru": 10
}

class RouteRequest(BaseModel):
    source: str
    destination: str
    use_risk: bool = True

@router.post("/optimize")
def optimize_route(request: RouteRequest):
    """
    Optimizes the route between source and destination.
    Fetches current region risk scores and calls RouteEngine.compare_routes().
    Returns both Route A (safest) and Route B (fastest) with paths, weights, and recommendation.
    """
    # Fetch risk scores if use_risk is true, else pass empty risks
    risks = MOCK_REGION_RISKS if request.use_risk else {}
    
    # Calculate routes using RouteEngine
    result = route_engine.compare_routes(request.source, request.destination, risks)
    
    return result

@router.get("/cities")
def get_cities():
    """
    Returns list of all available cities in the graph.
    """
    cities = list(route_engine.graph.nodes)
    return {"cities": cities}
