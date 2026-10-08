"""
JalMarg (जलमार्ग) - Amazon OpenSearch Spatial Indexing Engine
Manages geospatial polygon mapping and spatial proximity queries for flooded zones.
"""

import math
from typing import Dict, Any, List


class OpenSearchSpatialIndex:
    """
    Geospatial indexing engine for road polygons and waterlogged bounding boxes.
    """

    def __init__(self):
        # In-memory spatial index of active flooded road polygons
        self.active_zones: List[Dict[str, Any]] = []

    def index_flood_polygon(
        self,
        zone_id: str,
        road_name: str,
        center_lat: float,
        center_lng: float,
        radius_meters: float,
        depth_cm: int,
        severity: str
    ) -> Dict[str, Any]:
        """
        Indexes a flooded road segment with its bounding radius and depth metric.
        """
        record = {
            "zone_id": zone_id,
            "road_name": road_name,
            "center": {"lat": center_lat, "lng": center_lng},
            "radius_meters": radius_meters,
            "depth_cm": depth_cm,
            "severity": severity,
            "is_active": True
        }
        self.active_zones.append(record)
        return record

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two GPS coordinates in meters.
        """
        R = 6371000  # Radius of Earth in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def find_hazards_near_route(
        self,
        waypoints: List[Dict[str, float]],
        buffer_meters: float = 150.0
    ) -> List[Dict[str, Any]]:
        """
        Finds all active flooded zones that intersect or lie within buffer_meters of a route.
        """
        conflicting_hazards = []

        for zone in self.active_zones:
            if not zone["is_active"]:
                continue

            z_lat = zone["center"]["lat"]
            z_lng = zone["center"]["lng"]
            z_rad = zone["radius_meters"]

            # Check if any waypoint on the route falls within the hazard zone + buffer
            for pt in waypoints:
                dist = self.haversine_distance(pt["lat"], pt["lng"], z_lat, z_lng)
                if dist <= (z_rad + buffer_meters):
                    conflicting_hazards.append(zone)
                    break

        return conflicting_hazards
