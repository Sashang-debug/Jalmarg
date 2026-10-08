// ==============================================================================
// JalMarg (जलमार्ग) - Multi-City Real-Time Flood Telemetry Dataset
// Bengaluru (BLR), Delhi NCR (DEL), and Mumbai (BOM)
// ==============================================================================

export const CITY_CONFIGS = {
  BLR: {
    name: "Bengaluru (Outer Ring Rd)",
    center: [12.9280, 77.6350],
    zoom: 14,
    bounds: [[12.9100, 77.6150], [12.9460, 77.6480]]
  },
  DEL: {
    name: "Delhi NCR (Minto Bridge)",
    center: [28.6320, 77.2280],
    zoom: 14,
    bounds: [[28.6150, 77.2100], [28.6480, 77.2450]]
  },
  BOM: {
    name: "Mumbai (Western Suburbs)",
    center: [19.0838, 72.8427],
    zoom: 14,
    bounds: [[19.0650, 72.8250], [19.1020, 72.8600]]
  }
};

export const MULTI_CITY_INCIDENTS = {
  BLR: [
    {
      id: "INC_BLR_001",
      roadName: "Central Silk Board Junction",
      city: "BLR",
      ward: "Ward 174 (HSR)",
      lat: 12.9176,
      lng: 77.6238,
      depthCm: 48,
      severity: "CRITICAL_NO_ENTRY",
      source: "TWITTER_OSINT",
      author: "@BangaloreRider",
      riskDescription: "Water reaching car bonnets. Complete engine stall hazard.",
      reportedAt: "8 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: true,
      pumpStatus: "PUMP_EN_ROUTE"
    },
    {
      id: "INC_BLR_002",
      roadName: "Koramangala 80 Feet Road (Sony World)",
      city: "BLR",
      ward: "Ward 151 (Koramangala)",
      lat: 12.9352,
      lng: 77.6245,
      depthCm: 32,
      severity: "MODERATE_RISK",
      source: "CITIZEN_PWA",
      author: "Rohan_K",
      riskDescription: "Water reaching motorcycle silencer height. Unsafe for 2-wheelers.",
      reportedAt: "14 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: false,
      pumpStatus: "QUEUE_PENDING"
    },
    {
      id: "INC_BLR_003",
      roadName: "Bellandur EcoSpace Underpass",
      city: "BLR",
      ward: "Ward 150 (Bellandur)",
      lat: 12.9260,
      lng: 77.6762,
      depthCm: 65,
      severity: "CRITICAL_NO_ENTRY",
      source: "WHATSAPP_VOICE",
      author: "+91 98452 XXXXX",
      riskDescription: "Underpass submerged. 2 cars trapped. Municipal barricades advised.",
      reportedAt: "22 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: true,
      pumpStatus: "DEWATERING_ACTIVE"
    },
    {
      id: "INC_BLR_004",
      roadName: "Marathahalli Multiplex Service Road",
      city: "BLR",
      ward: "Ward 85 (Doddanekkundi)",
      lat: 12.9569,
      lng: 77.7011,
      depthCm: 14,
      severity: "PASSABLE",
      source: "CCTV_VISION",
      author: "BTP_CCTV_CAM_42",
      riskDescription: "Shallow surface runoff. Passable for all vehicles at slow speed.",
      reportedAt: "35 mins ago",
      photoUrl: "",
      pumpDispatched: false,
      pumpStatus: "MONITORING"
    }
  ],

  DEL: [
    {
      id: "INC_DEL_001",
      roadName: "Minto Bridge Underpass (Connaught Place)",
      city: "DEL",
      ward: "NDMC Zone 1",
      lat: 28.6358,
      lng: 77.2245,
      depthCm: 68,
      severity: "CRITICAL_NO_ENTRY",
      source: "TRAFFIC_POLICE_FEED",
      author: "@DelhiTrafficPolice",
      riskDescription: "Underpass submerged above bus axle height. Complete traffic closure.",
      reportedAt: "5 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: true,
      pumpStatus: "DEWATERING_ACTIVE"
    },
    {
      id: "INC_DEL_002",
      roadName: "ITO Junction / Vikas Marg Corridor",
      city: "DEL",
      ward: "MCD Central",
      lat: 28.6295,
      lng: 77.2415,
      depthCm: 42,
      severity: "CRITICAL_NO_ENTRY",
      source: "TWITTER_OSINT",
      author: "@DelhiCommuter99",
      riskDescription: "Water overflowing Yamuna canal drains. Severe gridlock for 2-wheelers.",
      reportedAt: "18 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: false,
      pumpStatus: "QUEUE_PENDING"
    },
    {
      id: "INC_DEL_003",
      roadName: "Dhaula Kuan Underpass (Ring Road)",
      city: "DEL",
      ward: "Delhi Cantonment",
      lat: 28.5925,
      lng: 77.1595,
      depthCm: 16,
      severity: "PASSABLE",
      source: "CITIZEN_PWA",
      author: "Vikas_Sharma",
      riskDescription: "Tire rim puddle. Passable at 20 km/h.",
      reportedAt: "30 mins ago",
      photoUrl: "",
      pumpDispatched: false,
      pumpStatus: "MONITORING"
    }
  ],

  BOM: [
    {
      id: "INC_BOM_001",
      roadName: "Milan Subway (Santacruz West)",
      city: "BOM",
      ward: "BMC Ward H-West",
      lat: 19.0838,
      lng: 72.8427,
      depthCm: 75,
      severity: "CRITICAL_NO_ENTRY",
      source: "BMC_DISASTER_CELL",
      author: "@mybmc",
      riskDescription: "Milan subway closed due to high tide rain accumulation. Divert via SV Road.",
      reportedAt: "10 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: true,
      pumpStatus: "DEWATERING_ACTIVE"
    },
    {
      id: "INC_BOM_002",
      roadName: "Hindmata Flyover Junction (Dadar)",
      city: "BOM",
      ward: "BMC Ward F-South",
      lat: 19.0125,
      lng: 72.8422,
      depthCm: 52,
      severity: "CRITICAL_NO_ENTRY",
      source: "WHATSAPP_VOICE",
      author: "+91 98200 XXXXX",
      riskDescription: "Water level at waist height on service lane. Avoid Dr. Ambedkar Road.",
      reportedAt: "15 mins ago",
      photoUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
      pumpDispatched: true,
      pumpStatus: "PUMP_EN_ROUTE"
    },
    {
      id: "INC_BOM_003",
      roadName: "Andheri Subway (Western Express)",
      city: "BOM",
      ward: "BMC Ward K-West",
      lat: 19.1197,
      lng: 72.8468,
      depthCm: 60,
      severity: "CRITICAL_NO_ENTRY",
      source: "CITIZEN_PWA",
      author: "Pooja_Mehta",
      riskDescription: "Subway completely flooded, heavy congestion on Gokhale Bridge.",
      reportedAt: "25 mins ago",
      photoUrl: "",
      pumpDispatched: false,
      pumpStatus: "QUEUE_PENDING"
    }
  ]
};

export const MULTI_CITY_POTHOLES = {
  BLR: [
    {
      id: "POTH_BLR_001",
      roadName: "Indiranagar 100 Feet Road",
      lat: 12.9719,
      lng: 77.6412,
      waterRecededHoursAgo: 5,
      advisory: "Water receded 5 hours ago. Severe crater cluster on left lane."
    },
    {
      id: "POTH_BLR_002",
      roadName: "Domlur Flyover Descent",
      lat: 12.9609,
      lng: 77.6387,
      waterRecededHoursAgo: 2,
      advisory: "Loose gravel and broken tarmac."
    }
  ],
  DEL: [
    {
      id: "POTH_DEL_001",
      roadName: "Connaught Place Outer Circle",
      lat: 28.6310,
      lng: 77.2180,
      waterRecededHoursAgo: 4,
      advisory: "Hidden pothole submerged under residual puddles."
    }
  ],
  BOM: [
    {
      id: "POTH_BOM_001",
      roadName: "SV Road Santacruz",
      lat: 19.0810,
      lng: 72.8390,
      waterRecededHoursAgo: 3,
      advisory: "Deep craters along pedestrian footpath."
    }
  ]
};

export const MULTI_CITY_ROUTES = {
  BLR: {
    origin: { lat: 12.9420, lng: 77.6200, name: "Koramangala 4th Block" },
    destination: { lat: 12.9120, lng: 77.6420, name: "HSR Layout Sector 1" },
    hazardName: "Central Silk Board",
    hazardDepth: 48,
    directPath: [
      [12.9420, 77.6200],
      [12.9352, 77.6245],
      [12.9250, 77.6230],
      [12.9176, 77.6238], // Silk Board 48cm
      [12.9120, 77.6420]
    ],
    detourPath: [
      [12.9420, 77.6200],
      [12.9380, 77.6350],
      [12.9300, 77.6450],
      [12.9210, 77.6430],
      [12.9120, 77.6420]
    ]
  },

  DEL: {
    origin: { lat: 28.6440, lng: 77.2160, name: "New Delhi Railway Station" },
    destination: { lat: 28.6220, lng: 77.2380, name: "Pragati Maidan / Supreme Court" },
    hazardName: "Minto Bridge Underpass",
    hazardDepth: 68,
    directPath: [
      [28.6440, 77.2160],
      [28.6358, 77.2245], // Minto Bridge 68cm
      [28.6280, 77.2300],
      [28.6220, 77.2380]
    ],
    detourPath: [
      [28.6440, 77.2160],
      [28.6400, 77.2290], // Barakhamba Road elevated bypass
      [28.6320, 77.2360],
      [28.6220, 77.2380]
    ]
  },

  BOM: {
    origin: { lat: 19.0600, lng: 72.8350, name: "Bandra Linking Road" },
    destination: { lat: 19.1000, lng: 72.8480, name: "Vile Parle East" },
    hazardName: "Milan Subway",
    hazardDepth: 75,
    directPath: [
      [19.0600, 72.8350],
      [19.0720, 72.8390],
      [19.0838, 72.8427], // Milan Subway 75cm
      [19.1000, 72.8480]
    ],
    detourPath: [
      [19.0600, 72.8350],
      [19.0700, 72.8520], // Western Express Highway Flyover bypass
      [19.0880, 72.8550],
      [19.1000, 72.8480]
    ]
  }
};

// ==============================================================================
// Popular Indian Metro Landmarks for Quick Selection
// ==============================================================================
export const CITY_LANDMARKS = {
  BLR: [
    { name: "Koramangala 4th Block", lat: 12.9420, lng: 77.6200 },
    { name: "HSR Layout Sector 1", lat: 12.9120, lng: 77.6420 },
    { name: "Central Silk Board", lat: 12.9176, lng: 77.6238 },
    { name: "Bellandur EcoSpace", lat: 12.9260, lng: 77.6762 },
    { name: "Indiranagar 100ft Road", lat: 12.9719, lng: 77.6412 },
    { name: "Electronic City Phase 1", lat: 12.8452, lng: 77.6602 },
    { name: "Hebbal Flyover Junction", lat: 13.0358, lng: 77.5970 },
    { name: "Whitefield Hope Farm", lat: 12.9830, lng: 77.7510 }
  ],
  DEL: [
    { name: "Connaught Place (CP)", lat: 28.6315, lng: 77.2167 },
    { name: "Minto Bridge Underpass", lat: 28.6358, lng: 77.2245 },
    { name: "Pragati Maidan / Court", lat: 28.6220, lng: 77.2380 },
    { name: "ITO Junction", lat: 28.6289, lng: 77.2405 },
    { name: "Lajpat Nagar Central", lat: 28.5677, lng: 77.2433 },
    { name: "Gurugram Cyber Hub", lat: 28.4950, lng: 77.0890 },
    { name: "IGI Airport Terminal 3", lat: 28.5562, lng: 77.1000 }
  ],
  BOM: [
    { name: "Bandra Linking Road", lat: 19.0600, lng: 72.8350 },
    { name: "Bandra Kurla Complex (BKC)", lat: 19.0657, lng: 72.8680 },
    { name: "Dadar TT Circle", lat: 19.0178, lng: 72.8478 },
    { name: "Milan Subway Santacruz", lat: 19.0838, lng: 72.8427 },
    { name: "Andheri Subway", lat: 19.1197, lng: 72.8468 },
    { name: "Hindmata Cinema Dadar", lat: 19.0090, lng: 72.8410 },
    { name: "Kurla West Station", lat: 19.0650, lng: 72.8790 }
  ]
};

// Haversine distance helper in kilometers
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Distance from point to line segment
function distanceToSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  const lineDist = calculateHaversineDistance(aLat, aLng, bLat, bLng);
  if (lineDist === 0) return calculateHaversineDistance(pLat, pLng, aLat, aLng);

  // Projection scalar t
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)));
  const projLat = aLat + t * dy;
  const projLng = aLng + t * dx;
  return calculateHaversineDistance(pLat, pLng, projLat, projLng);
}

// ==============================================================================
// Dynamic Flood-Aware Routing Engine
// Calculates safe flyover bypasses & clearance thresholds
// ==============================================================================
export function calculateDynamicRoute(origin, destination, selectedCity, vehicle, incidents) {
  if (!origin || !destination) {
    return MULTI_CITY_ROUTES[selectedCity] || MULTI_CITY_ROUTES.BLR;
  }

  const cityIncidents = incidents || [];
  const baseDistance = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const steps = 6;

  // 1. Generate direct corridor coordinates
  const directPath = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add small realistic road curve
    const curve = Math.sin(ratio * Math.PI) * 0.003;
    directPath.push([
      origin.lat + (destination.lat - origin.lat) * ratio + curve,
      origin.lng + (destination.lng - origin.lng) * ratio
    ]);
  }

  // 2. Detect any flood incidents along the corridor (within 1.2 km of the path)
  let worstHazard = null;
  cityIncidents.forEach((inc) => {
    const distToCorridor = distanceToSegment(
      inc.lat,
      inc.lng,
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    if (distToCorridor <= 1.4) {
      if (!worstHazard || inc.depthCm > worstHazard.depthCm) {
        worstHazard = inc;
      }
    }
  });

  // Vehicle clearance limits
  const VEHICLE_THRESHOLDS = {
    BIKE: 20,
    SEDAN: 30,
    SUV: 55
  };

  const limit = VEHICLE_THRESHOLDS[vehicle] || 20;
  const isBlocked = worstHazard && worstHazard.depthCm >= limit;

  // 3. Build Detour Path if blocked
  let detourPath = [];
  if (isBlocked && worstHazard) {
    // Generate an elevated bypass bending away from the hazard
    const midRatio = 0.5;
    const perpLat = -(destination.lng - origin.lng) * 0.45;
    const perpLng = (destination.lat - origin.lat) * 0.45;

    detourPath = [
      [origin.lat, origin.lng],
      [
        origin.lat + (destination.lat - origin.lat) * 0.25 + perpLat * 0.5,
        origin.lng + (destination.lng - origin.lng) * 0.25 + perpLng * 0.5
      ],
      [
        origin.lat + (destination.lat - origin.lat) * 0.5 + perpLat,
        origin.lng + (destination.lng - origin.lng) * 0.5 + perpLng
      ],
      [
        origin.lat + (destination.lat - origin.lat) * 0.75 + perpLat * 0.5,
        origin.lng + (destination.lng - origin.lng) * 0.75 + perpLng * 0.5
      ],
      [destination.lat, destination.lng]
    ];
  } else {
    // If not blocked, detour path matches direct path
    detourPath = [...directPath];
  }

  const directDistanceKm = Math.max(1.2, parseFloat(baseDistance.toFixed(1)));
  const directTimeMins = Math.max(4, Math.round(directDistanceKm * 2.4));
  const detourDistanceKm = isBlocked ? parseFloat((directDistanceKm * 1.28).toFixed(1)) : directDistanceKm;
  const detourTimeMins = isBlocked ? directTimeMins + 4 : directTimeMins;

  const hazardName = worstHazard ? worstHazard.roadName : "No Water Hazard";
  const hazardDepth = worstHazard ? worstHazard.depthCm : 0;

  // Dynamic Audio Radar Alerts
  let speechHindi = "";
  let speechEnglish = "";

  if (isBlocked) {
    speechHindi = `सावधान! ${hazardName} पर ${hazardDepth} सेंटीमीटर पानी भरा है। बाइक के लिए तुरंत फ्लाइओवर वाला रास्ता लें।`;
    speechEnglish = `Caution! Severe waterlogging of ${hazardDepth} cm at ${hazardName}. Diverting via safe elevated bypass.`;
  } else if (hazardDepth > 0) {
    speechHindi = `मार्ग खुला है। ${hazardName} पर पानी ${hazardDepth} सेमी है। वाहन धीमी गति से निकालें।`;
    speechEnglish = `Route open. Minor waterlogging of ${hazardDepth} cm detected at ${hazardName}. Proceed with caution.`;
  } else {
    speechHindi = `मार्ग पूरी तरह सूखा और सुरक्षित है। कोई जलभराव नहीं है।`;
    speechEnglish = `Route is completely clear and dry. Safe journey.`;
  }

  return {
    origin,
    destination,
    hazardName,
    hazardDepth,
    directPath,
    detourPath,
    isDetourRequired: isBlocked,
    distanceKm: isBlocked ? detourDistanceKm : directDistanceKm,
    estTimeMins: isBlocked ? detourTimeMins : directTimeMins,
    avoidedDepth: isBlocked ? hazardDepth : 0,
    speechHindi,
    speechEnglish,
    advisoryText: isBlocked
      ? `Water at ${hazardName} is ${hazardDepth} cm deep (exceeds ${vehicle} safe limit of ${limit} cm). Diverting via elevated flyover bypass (+4 mins).`
      : hazardDepth > 0
      ? `Water at ${hazardName} is ${hazardDepth} cm deep. Passable for ${vehicle} within safe threshold.`
      : `Direct corridor clear of flood hazards. Normal dry transit.`
  };
}
