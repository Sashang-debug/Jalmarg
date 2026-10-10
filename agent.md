# AGENT DIRECTIVE: JalMarg (जलमार्ग) Engineering Playbook

> **Primary Master Reference:** Read [JALMARG_BLUEPRINT.md](file:///Users/sashangraj/Desktop/buildBharat/JALMARG_BLUEPRINT.md) for the complete domain architecture, data schemas, Cedar policies, and judging strategy.  
> **Mandatory UI/UX Standard:** Enforce [design-taste-frontend SKILL.md](file:///Users/sashangraj/Desktop/buildBharat/.agents/skills/design-taste-frontend/SKILL.md) for all client-side development.  
> **Living Document Rule:** **This file (`agent.md`) must be updated by the agent immediately after the completion of each feature or phase** to reflect real-time progress.

---

## 1. Project Brief: JalMarg (जलमार्ग)

* **Hackathon Track:** Heat and Water (Monsoon Waterlogging, Flash Floods, Civic Infrastructure Resilience).
* **Theme:** Build for Bharat (AWS x WeMakeDevs Hackathon).
* **The Core Innovation:** Moving urban mobility from delayed, binary traffic indicators (*"Dark Red Traffic"* on Google Maps) to **centimeter-accurate, real-time water depth intelligence ($\pm 5\text{ cm}$)**.
* **Core Capabilities:**
  1. Multimodal ingestion from citizen photos, social media OSINT (X/Reddit), and rainfall telemetry.
  2. Computer vision-based water depth estimation (analyzing submerged tire rims, pedals, and dividers).
  3. Dynamic vehicle-clearance-tailored navigation (differentiated safety thresholds for 2-wheelers vs. hatchbacks vs. SUVs).
  4. Hands-free vernacular audio radar (Amazon Polly) for 2-wheeler gig delivery riders in torrential rain.
  5. Predictive "Time-to-Submerge" pre-flood warning engine.
  6. Automated civic de-watering pump dispatch tickets for municipal corporations (BBMP, BMC, MCD).

---

## 2. Master Technology Stack

### 2.1 Core AWS Services & Tools (Baseline from Blueprint)
* **Agents & Generative AI:** 
  * `Strands Agents SDK` (Local open-source multi-agent framework)
  * `Amazon SageMaker AI` (CV Water-Depth estimation & inference)
  * `Amazon Bedrock` (Multilingual Indian NER & colloquial landmark parsing)
  * `Amazon Rekognition` (Pre-filtering & landmark landmark baseline)
  * `PartyRock` (Rapid agent workflow prototyping)
* **Voice & Vernacular Processing:** 
  * `Amazon Polly` (Neural Text-to-Speech audio radar in Hindi, Kannada, Tamil, English)
  * `Amazon Transcribe` (WhatsApp voice-note transcription)
* **Spatial, Maps & Routing:** 
  * `Amazon Location Service` (Geofencing flood polygons, vehicle routing matrix, vector tiles)
* **Serverless & Orchestration:** 
  * `AWS Step Functions` (End-to-end incident verification state machine)
  * `AWS Lambda` (Event microservices)
  * `Amazon API Gateway` (REST & WebSocket live telemetry endpoints)
  * `AWS SAM CLI` (Serverless Application Model infrastructure-as-code)
  * `LocalStack` (100% offline local AWS cloud emulation)
* **Containers & Runtimes:** 
  * `Finch` (Open-source container CLI for building scraper images on macOS)
  * `AWS App Runner` / `Amazon ECS on AWS Fargate` (Containerized background workers)
  * `Amazon Corretto` (OpenJDK runtime)
  * `Firecracker` (Sandboxed MicroVM execution)
* **Data, Search & Storage:** 
  * `Amazon OpenSearch Service` (Geospatial `geo_shape` indexing & spatial search)
  * `Amazon DynamoDB` (Single-digit ms incident store with TTL auto-expiry)
  * `Amazon S3` (Evidence photo, video & audio storage)
  * `Amazon Aurora Serverless / RDS` (Municipal ward boundaries & civic pump assets)
* **Security, Auth & Governance:** 
  * `Cedar Policy Engine` (Fine-grained authorization & verification policy)
  * `Amazon Cognito` (Citizen and municipal role-based identity pools)
  * `AWS Verified Permissions` (Managed Cedar policy evaluation)
* **Plumbing & Networking:** 
  * `Amazon EventBridge` & `EventBridge Pipes` (Event-driven bus)
  * `Amazon SQS` (Dead-letter & priority dispatch queues)
  * `Amazon SNS` (Emergency SMS/Push broadcast alerts)
  * `Amazon CloudFront` (Global edge caching)
  * `Amazon Route 53` (DNS routing & health checks)
* **Observability:** 
  * `Amazon CloudWatch` (Metrics, alarms, operational dashboards)
  * `AWS X-Ray` (End-to-end distributed tracing)
* **Frontend Hosting:** 
  * `AWS Amplify Hosting` (Continuous deployment for mobile-first PWA)

### 2.2 On-The-Go AWS Extensibility Directive
> **Rule:** The agent is **explicitly encouraged and authorized** to pull in additional AWS services *on the go* whenever they strengthen the architecture, optimize performance, or add hackathon punch. Examples:
> * `Amazon Athena` for querying historical flood log data in S3.
> * `AWS WAF` to protect public API Gateway endpoints against crowdsource abuse.
> * `AWS Secrets Manager` / `SSM Parameter Store` for API tokens and scraper secrets.
> * `Amazon CloudWatch Synthetics` for canary testing incident ingestion endpoints.

---

## 3. Mandatory Frontend Standard: `design-taste-frontend`

Every frontend component, page, or dashboard must follow the instructions in **[.agents/skills/design-taste-frontend/SKILL.md](file:///Users/sashangraj/Desktop/buildBharat/.agents/skills/design-taste-frontend/SKILL.md)**.

### Aesthetic Execution: "Midnight Tactical Storm"
* **Tone & Persona:** Tactical, situationally aware, mission-critical, premium dark mode.
* **Palette:**
  * Background: Deep midnight slate (`#080C14`, `#0D111C`).
  * Surface/Cards: Glassmorphism (`backdrop-filter: blur(12px)`, border: `1px solid rgba(255, 255, 255, 0.08)`).
  * Safe Status: Emerald Green (`#10B981`).
  * Caution / Moderate (10–25 cm): Amber Neon (`#F59E0B`).
  * Critical / Submerged (>35 cm): Crimson Pulse (`#EF4444`).
  * Post-Flood Pothole Alert: Tactical Purple (`#8B5CF6`).
* **Typography:** `Outfit` / `Inter` with tabular numbers for exact centimeter metrics (`48 cm`).
* **Interaction Rules:**
  * Zero generic starter templates or low-effort Tailwind cards.
  * Single-tap vehicle profile switcher (**🛵 2-Wheeler** | **🚗 Car** | **🚙 SUV**) in header.
  * Draggable mobile bottom-sheet for road reports.
  * Pulsing audio wave animation when the hands-free radar is active.

---

## 4. Mandatory Development Workflow: Plan $\rightarrow$ Build $\rightarrow$ Test

For **every single feature or component**, the agent must strictly execute in three iterative stages:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     1. PLAN     │  ───> │    2. BUILD     │  ───> │     3. TEST     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
 • Architecture & APIs     • Code Implementation     • Unit / Mock Test
 • AWS Services Needed     • Clean Documentation     • Edge-Case Validation
 • UI/UX Spec (Skill)      • Follow Standards        • Update agent.md
```

1. **PLAN:**
   * Clarify user requirements and feature boundaries.
   * Identify all AWS services and API contracts involved.
   * Review frontend taste standards if building UI elements.
2. **BUILD:**
   * Implement code cleanly without placeholders or broken mock logic.
   * Adhere to coding standards, preserving all relevant comments.
   * Write clean configuration (SAM `template.yaml`, Cedar policies, etc.).
3. **TEST:**
   * Verify the component works end-to-end (run scripts, test endpoints, or simulate user interactions).
   * Confirm edge cases (e.g., negative water depth, network drops, unverified users).
   * **Update this `agent.md` file** to reflect the new feature status.

---

## 5. Phase-Wise Development Roadmap & Feature Tracker

> **Notice:** Update the checkboxes and completion notes in this section after finishing each feature!

### Phase 0: Project Inception, Environment Diagnostics & Baseline
- [x] **0.1 System Environment Audit** (Verified: Node v22.23.2, npm 10.9.8, Python 3.14.3, Docker 29.2.1, AWS CLI 2.37.10, SAM CLI 1.167.0)
- [x] **0.2 Project Workspace Taxonomy & Directory Skeleton** (`frontend/`, `backend/`, `agents/`, `policies/`, `docker/`, `data/`)
- [x] **0.3 Baseline Environment Variables & Configuration Contracts** (`.env.example`, `.gitignore`)
- [x] **0.4 Architectural & Technology Lock** (All requirements from blueprint mapped)

### Phase 1: Local Foundation & Scaffolding
- [x] **1.1 Project Structure Setup** (Vite + React frontend with Leaflet & Lucide icons + Python SAM backend)
- [x] **1.2 SAM Template (`template.yaml`)** (Verified with `sam validate --lint`: DynamoDB TTL table, S3 evidence vault, EventBridge custom bus, SQS queue/DLQ, API Gateway, and Lambda handlers)
- [x] **1.3 LocalStack & OpenSearch Configuration** (Verified with `docker compose config`: LocalStack on port 4566, OpenSearch on port 9200)
- [x] **1.4 Finch / Container Configuration** (Created `docker/Dockerfile.worker` for containerized background OSINT scrapers)
- [x] **1.5 Frontend Foundation & Design Tokens** (Verified with `npm run build`: Midnight Tactical Storm design system in `frontend/src/index.css`)

### Phase 2: Agentic Intelligence, Vision & Security
- [x] **2.1 Strands Agents SDK Setup** (Created `agents/strands_osint_agent.py`: Noise filtering, flood keyword classification, and urgency scoring)
- [x] **2.2 Amazon Bedrock Landmark Resolver** (Created `agents/landmark_resolver.py`: Colloquial Indian landmark geocoding for Bengaluru, Mumbai, and Delhi)
- [x] **2.3 Computer Vision Depth Estimator (SageMaker / OpenCV)** (Created `agents/cv_depth_estimator.py`: Submersion anchor analysis producing centimeter depths and clearance matrices)
- [x] **2.4 Cedar Policy Engine Authorization** (Created `policies/jalmarg_policies.cedar` and `policies/cedar_evaluator.py`: Enforcing zero-trust civic authority vs citizen permissions)
- [x] **2.5 Automated Test Suite** (Verified: `tests/test_phase2_intelligence.py` passed all 4 test suites with 100% success)

### Phase 3: Spatial Engine, Routing & Event Plumbing
- [x] **3.1 Amazon OpenSearch Spatial Indexing** (Created `backend/src/spatial_index.py`: Polygon indexing and Haversine collision queries)
- [x] **3.2 Amazon Location Service Integration** (Created `backend/src/route_engine.py`: Vehicle-specific routing matrices with dynamic detour calculations)
- [x] **3.3 AWS Step Functions State Machine** (Created `backend/step_functions/incident_pipeline.json`: ASL orchestration for verification, storage, and critical parallel dispatch)
- [x] **3.4 Amazon Polly Audio Radar** (Created `backend/src/polly_audio.py`: Hindi Aditi & Indian English Kajal neural SSML voice alert synthesis)
- [x] **3.5 Amazon Transcribe / WhatsApp Bot Integration** (Created `backend/src/whatsapp_voice_handler.py`: Voice note transcription to structured flood incident)
- [x] **3.6 Automated Test Suite** (Verified: `tests/test_phase3_spatial_and_plumbing.py` passed all 5 test suites with 100% success)

### Phase 4: Frontend Development (Anti-Slop UI/UX)
- [x] **4.1 Design System & Shell** (Implemented `Midnight Tactical Storm` dark cockpit theme in `frontend/src/index.css`)
- [x] **4.2 Interactive Map Interface** (Created `frontend/src/components/InteractiveMap.jsx`: Leaflet dark tiles, custom pulsing depth markers, and live tooltips)
- [x] **4.3 Vehicle Profile Switcher** (Created `frontend/src/components/TacticalHeader.jsx`: Dynamic route morphing for 2-Wheeler vs Sedan vs SUV)
- [x] **4.4 Hands-Free Audio Radar Player** (Created `frontend/src/components/AudioRadarDrawer.jsx`: Live speech synthesis with oscillating audio visualizer)
- [x] **4.5 Incident Reporter Modal** (Created `frontend/src/components/ReportModal.jsx`: Photo anchor form + WhatsApp voice-note ingestion simulator)
- [x] **4.6 Post-Flood Pothole Layer** (Dynamic toggle rendering 48-hour post-flood crater hazards across Bengaluru)
- [x] **4.7 Municipal Ward Pump Command Dashboard** (Created `frontend/src/components/MunicipalPumpDashboard.jsx`: SQS high-priority de-watering pump queue)
- [x] **4.8 Frontend Verification** (Verified with `npm run build` [277ms bundle] and running live on `http://localhost:5173/`)
- [x] **4.9 Google Maps Dark Navigation Palette Upgrade** (Integrated authentic Google Maps multi-subdomain tiles, Navy Slate `#181E29` background, stark white road text `#FFFFFF`, luminous double-cased Emerald `#00E676` & Electric Blue `#4285F4` laser routes, and floating route waypoint badges)
- [x] **4.10 Dynamic Start & Destination Journey Planner** (Created `frontend/src/components/JourneyPlanner.jsx`: Google Navigation style pill with Start/Destination selectors, one-click point swapping, quick landmark chips, map-click crosshair picker, real-time clearance routing calculation, and responsive Amazon Polly audio radar sync)
- [x] **4.11 Real Street-Accurate Road Network Snapping** (Fixed off-road diagonal routes: integrated high-resolution real asphalt road geometries via OSRM & road router cache in `frontend/src/utils/roadRouter.js` and `mockTelemetry.js`, eliminating cross-building lines)
- [x] **4.12 Google Maps JavaScript API Engine & Key Manager** (Created `frontend/src/components/GoogleMapEngine.jsx` using `@googlemaps/js-api-loader` with official Google dark styling, live traffic layer toggle, custom HTML depth overlays, and real-time key connection modal `GoogleApiKeyModal.jsx` with zero-restart fallback)
- [x] **4.13 Authentic Google Maps Desktop UI Architecture** (Revamped frontend layout to 100% full-screen map, Google Maps floating search bar `GoogleMapsSearchBar.jsx` with autocomplete, collapsible directions sidebar `GoogleMapsDirectionsSidebar.jsx` with vehicle travel mode tabs, route alternatives, clearance advisory banner, toggleable `<` / `>` sidebar handle, and slide-out hamburger menu drawer `GoogleMapsMenuDrawer.jsx`)

### Phase 5: Observability, Packaging & Pitch Polish
- [x] **5.1 Amazon CloudWatch Dashboard & Alarms** (Created `backend/src/cloudwatch_metrics.py` and `backend/cloudwatch_dashboard.json`: Live operational metrics `WaterDepthCm`, `ActiveFloodedSegments`, `VehicleReroutes`, and `PumpDispatchLatencySec` plus automated threshold alarms)
- [x] **5.2 AWS X-Ray Tracing** (Created `backend/src/xray_tracer.py`: End-to-end distributed trace context `1-{epoch}-{random}` instrumenting all 8 microservice tiers and generating interactive service map DAG graphs)
- [x] **5.3 Frontend Observability Cockpit** (Created `frontend/src/components/ObservabilityModal.jsx`: High-tech cockpit with live CloudWatch KPI gauges, interactive X-Ray microservice call graph with latency breakdown, CloudWatch JSON exporter, and 3-minute hackathon pitch script)
- [x] **5.4 Automated Test Suite Validation** (Verified: `tests/test_phase5_observability.py` passed all 6 test suites with 100% success in 0.246s)

---

## 6. UI & Google Maps Bug Fixes & Refinements

* **Route Line Deduplication (Bug Fixed):**
  - Truncated avoided direct hazard line so the red line strictly begins where the corridor branches off into the flood hazard (Minto Road), eliminating overlapping red and blue lines along the shared Connaught Place circle.
* **Sidebar Toggle Reliability (Bug 1 Fixed):** 
  - Resolved unmounting issue where closing or toggling the sidebar removed the floating `< / >` chevron handle.
  - Sidebar is now persistently mounted with smooth CSS `translateX` animation, with the toggle handle permanently accessible at `left: isSidebarOpen ? '408px' : '0px'`.
  - Synced state bidirectionally across the chevron handle, the `✕` close button, the hamburger menu drawer "Show side bar" toggle switch, and the floating search bar directions triggers.
* **Dropdown Click-Outside Dismissal (Bug 2 Fixed):**
  - Resolved Google Maps / Leaflet canvas DOM event trapping where internal `stopPropagation()` prevented bubbling to `document`.
  - Added capture-phase (`useCapture: true`) window event listeners for `pointerdown`, `mousedown`, `touchstart`, and `click` on `GoogleMapsSearchBar` and `GoogleMapsDirectionsSidebar`.
  - Added Escape key handler and input blur on outside clicks.
* **Live GPS Location on Initial Site Load (Bug 3 Fixed):**
  - Added `useEffect` in `App.jsx` to trigger `handleAutoDetectLocation()` automatically on mount.
  - Implemented authentic Google Maps pulsing live GPS beacon (`gmaps-pulse` keyframe animation with vibrant `#1A73E8` core, white ring, and "Your location" badge).
  - Ensured `GoogleMapEngine` and `InteractiveMap` prioritize and maintain focus on `userLocation` without being overridden by default city resets.

* **Prominent Source & Destination Visual Definitions:**
  - Added dedicated Google Maps map markers for both Source (A) and Destination (B).
  - Source marker: emerald green circular target icon with `SOURCE: [Location Name]` callout badge.
  - Destination marker: authentic Google Maps Red Teardrop Marker 📍 with `DESTINATION: [Location Name]` callout badge anchored precisely to the destination coordinates.
  - Redesigned sidebar input cards with distinct `SOURCE / STARTING POINT (A)` and `DESTINATION / END POINT (B)` headings, color-coded timeline connectors, and city-aware corridor labels.

---

## 7. Current Status & Next Immediate Action

* **Current State:** **All 5 Phases Complete (End-to-End Hackathon Production Ready).**
  - **Phase 1:** Serverless scaffolding & LocalStack/SAM foundation.
  - **Phase 2:** Strands OSINT parser, Bedrock landmark resolver, SageMaker CV depth estimator, and Cedar policy engine.
  - **Phase 3:** OpenSearch spatial polygon queries, Location Service vehicle routing, Step Functions pipeline, Amazon Polly audio radar, and WhatsApp voice ingestion.
  - **Phase 4:** Desktop-class Google Maps navigation UI, collapsible sidebar, live traffic, vehicle tabs, and street-accurate road routing.
  - **Phase 5:** CloudWatch metrics publisher, operational alarms, AWS X-Ray distributed trace graph, official dashboard JSON, and interactive Observability Cockpit modal.
* **Next Action:** Ready for live judge demonstration, pitch rehearsal, and hackathon submission.


