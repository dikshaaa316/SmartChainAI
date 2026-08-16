import networkx as nx

# ------------------------------------------------------------------------------
# ROUTE PATH PLANNING ENGINE
# ------------------------------------------------------------------------------
# This module constructs route graphs using networkx. It runs optimization pathfinding
# algorithms (e.g. shortest path weighted by distance, cost, and predicted risk factor)
# to recommend the safest and most efficient path.

class RouteEngine:
    """
    RouteEngine class for calculating optimal supply chain paths.
    Uses NetworkX to build a graph of Indian cities and their distances.
    """
    
    def __init__(self):
        self.graph = self.build_graph()

    def build_graph(self):
        """
        Creates a NetworkX graph with Indian cities as nodes and highways as edges.
        """
        G = nx.Graph()
        
        # Add edges with distances
        G.add_edge("Mumbai", "Delhi", distance=1400)
        G.add_edge("Mumbai", "Hyderabad", distance=700)
        G.add_edge("Hyderabad", "Chennai", distance=700)
        G.add_edge("Hyderabad", "Delhi", distance=1200)
        G.add_edge("Delhi", "Kolkata", distance=1500)
        G.add_edge("Kolkata", "Chennai", distance=1700)
        G.add_edge("Chennai", "Bengaluru", distance=350)
        G.add_edge("Bengaluru", "Mumbai", distance=1000)
        G.add_edge("Delhi", "Bengaluru", distance=2000)
        
        return G

    def get_optimal_route(self, source, destination, region_risks):
        """
        Finds the shortest path weighted by distance and region risks.
        Sets edge weight = distance + (avg risk of connected cities * 10).
        """
        if source not in self.graph or destination not in self.graph:
            return None, 0
            
        # Create a copy of the graph to modify weights safely
        G_weighted = self.graph.copy()
        
        # Calculate new weights based on distance and risk
        for u, v, data in G_weighted.edges(data=True):
            u_risk = region_risks.get(u, 0)
            v_risk = region_risks.get(v, 0)
            avg_risk = (u_risk + v_risk) / 2
            
            # Apply risk penalty (avg risk of connected cities * 10)
            data['weight'] = data['distance'] + (avg_risk * 10)
            
        try:
            # Use Dijkstra's algorithm to find shortest weighted path
            path = nx.dijkstra_path(G_weighted, source, destination, weight='weight')
            
            # Calculate total weight
            total_weight = sum(G_weighted[path[i]][path[i+1]]['weight'] for i in range(len(path)-1))
            
            return path, total_weight
        except nx.NetworkXNoPath:
            return None, 0
            
    def compare_routes(self, source, destination, region_risks):
        """
        Returns Route A (optimal/safest) and Route B (shortest by distance only)
        Returns which one is recommended and why.
        """
        # Route A: Safest (Weighted by distance + risk)
        safe_path, safe_weight = self.get_optimal_route(source, destination, region_risks)
        
        # Route B: Shortest by distance only (Using empty risk dictionary)
        fast_path, fast_weight = self.get_optimal_route(source, destination, {})
        
        # Determine recommendation
        if safe_path == fast_path:
            recommendation = "Both routes are identical. The fastest route is also the safest."
            recommended = "A"
        else:
            # Route A avoided high risk areas
            recommendation = "Route A avoids high-risk areas, making it the safer choice despite potentially being longer in pure distance."
            recommended = "A"
            
        return {
            "route_a": {
                "path": safe_path,
                "weight": round(safe_weight, 2),
                "label": "Safe Route"
            },
            "route_b": {
                "path": fast_path,
                "weight": round(fast_weight, 2),
                "label": "Fast Route"
            },
            "recommended": recommended,
            "reason": recommendation
        }
