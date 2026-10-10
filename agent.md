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

## 7. Archived prototype milestone (superseded by section 8)

* **Current State:** **Original prototype milestone; cloud integration and production readiness were not verified.**
  - **Phase 1:** Serverless scaffolding & LocalStack/SAM foundation.
  - **Phase 2:** Strands OSINT parser, Bedrock landmark resolver, SageMaker CV depth estimator, and Cedar policy engine.
  - **Phase 3:** OpenSearch spatial polygon queries, Location Service vehicle routing, Step Functions pipeline, Amazon Polly audio radar, and WhatsApp voice ingestion.
  - **Phase 4:** Desktop-class Google Maps navigation UI, collapsible sidebar, live traffic, vehicle tabs, and street-accurate road routing.
  - **Phase 5:** CloudWatch metrics publisher, operational alarms, AWS X-Ray distributed trace graph, official dashboard JSON, and interactive Observability Cockpit modal.
* **Next Action:** Ready for live judge demonstration, pitch rehearsal, and hackathon submission.



## 8. Improvement phase — 10 October 2026

The earlier phase checkboxes describe prototype modules, not verified production
integrations. The blueprint remains a vision document. The following tracker is the
authoritative status of the improvement work.

### 8.1 Shared incident platform — plan → build → test
- **Plan:** Shared API contract, durable local/cloud repositories, evidence storage,
  protected operator actions and a real processing workflow. See IMPLEMENTATION_PLAN.md.
- **Built:** `api.py`, `incident_service.py`, `incident_repository.py`, and
  `backend/local_server.py`; SQLite persistence, private S3/DynamoDB implementation,
  optimistic version writes, status history, expiry, observation validation, Cognito
  group checks, local-only operator token, and a deployable processing state machine.
- **Tested:** 14 new backend behavior tests passed, covering restart/session
  persistence, invalid coordinates, caller-supplied trust flags, unauthorized review,
  duplicate observations, conditional updates, evidence validation, expiry, retry
  idempotence and processing failure. `sam validate --lint` passed.
- **Limit:** Cloud resources have not been deployed; Cognito and DynamoDB/S3 runtime
  execution must be smoke-tested after deployment. Public browser identifiers limit
  accidental repeat observations, not malicious Sybil submissions. No automatic
  confirmation, image depth inference or municipal pump dispatch is performed.

### 8.2 Street routing and provider switching — plan → build → test
- **Plan:** Check real route segments, all alternatives, expiry and threshold edges;
  remove synthetic fallback routes and conditional React hooks.
- **Built:** `floodRouting.js` compares every road segment in a local tangent plane;
  checks returned alternatives and both avoidance waypoints; distinguishes available,
  blocked, loading and unavailable results. Stale route responses are cancelled.
  Leaflet/Google are isolated components loaded lazily, eliminating provider hook-order
  violations and reducing the initial JS bundle from 571 KB to about 301 KB.
- **Tested:** 11 Node tests passed: sparse/curved routes, false endpoint-chord collisions,
  expiry, clearance boundaries, blocked alternatives, failed detours and offline routing.
  Frontend build and lint passed with no errors; legacy component warnings remain.
- **Limit:** OSRM driving estimates are shared across vehicle profiles. Avoidance
  settings are prototype heuristics, not vehicle safety certifications or flood measurements.

### 8.3 Commuter interface — plan → build → test
- Original midnight JalMarg shell with clear journey inputs, vehicle profiles,
  route rationale and active report list; responsive mobile sheet and native modal
  focus management. Live reports and recorded replay are visibly separated.
- Three-step reporting re-encodes photos to strip EXIF and reduce upload size.
  Evidence view includes timestamps, approximate level, review status, follow-up
  observations and audit history. Separate operator workspace uses local development
  token or Cognito authorization-code + PKCE login; tokens remain in memory.
- Audio uses explicitly labeled device speech, without claiming Amazon Polly.
- Existing WhatsApp source edits remain intact; the old reporting simulator is not
  used by the new public reporting flow.

- **Browser-tested:** Report submission and explicit review screen; refresh persistence;
  second-tab visibility; local operator confirmation, review ticket and clearance;
  clearance propagation; desktop Google Maps with a real OSRM route; 390 × 844
  mobile sheet expansion and reporting modal; Escape dismissal. One temporary
  synthetic report was marked cleared after testing. Fixed a Continue/Submit DOM
  reuse issue found in browser testing, validated coordinate limits, removed duplicate
  photo preview from uploads, and added the mobile operator accessible label.
- **Remaining UX validation:** Device GPS permissions, real camera upload and spoken
  voice output need a physical-device check. Evidence bytes and MIME behavior are
  covered in backend tests. Cognito sign-in needs a deployed pool.

### 8.4 Delivery — plan → build → test
- README now distinguishes the working shared journey from legacy simulations.
  DEPLOYMENT.md documents cloud setup, exact environment variables, operators,
  retained resources and required cloud smoke checks. Existing user changes in
  WhatsApp webhook and old ReportModal were preserved.
- Final automated checks: 20 Python unittest cases passed (14 new + 6 legacy),
  Phase 2 script 4/4 and Phase 3 script 5/5 passed; 11 frontend routing tests passed;
  Vite production build passed (initial JS ~302 KB, separate map chunks);
  oxlint passed with zero errors and existing legacy/component warnings;
  SAM template lint validation passed.
- `sam build` attempted but blocked: Python 3.12 runtime is absent on this host
  (available default is Python 3.14). Install the matching runtime or build with
  Docker before deploying. CloudFormation Guard is absent, so its compliance checks
  have not run. No cloud resources created; no successful cloud build or runtime
  deployment claimed. CLI identity and IAM deployment action simulation were verified
  earlier; that does not establish quota/SCP/deployment success.
- Local API/frontend remain available at 127.0.0.1:3001 and 127.0.0.1:5173.
  They are development processes, not production hosting.

- **Provider check:** Switching Google → Leaflet produced no browser errors. CARTO
  returned key-required placeholder tiles, so the fallback now uses standard OSM
  raster tiles with visible attribution and normal browser caching. Actual OSM
  map rendering was verified; mobile width equals document width (390 px, no
  horizontal overflow). Screenshots are saved under docs/.

## 9. Maps interface rework — October 10, 2026

### 9.1 Plan and build
- Audited the user's Google Maps references and previous layout. Plan recorded in
  `UI_REWORK_PLAN.md`; applied the required frontend design skill and official
  Material Web controls. Compact directions, navigation rail/menu and map layers
  replace the headline-heavy shell. New navigation-pin wordmark, blue source and
  red destination pins, larger waterlogging warning markers and labeled captions.
- Light/dark/system appearance, actual Google traffic/transit/terrain/satellite
  layers, satellite labels and GPS recentering. OSM fallback explicitly disables
  unsupported layers. Traffic is visual; OSRM ETA is still a driving estimate.
- Gwalior is the default. GPS/map/search coordinates determine the reporting city,
  overriding stale Mumbai context. Unknown cities use OTHER, never Mumbai. The
  API accepts GWL and OTHER. Reporting uses place search, named road and adjustable
  map pin; normal latitude/longitude fields removed. Address lookup failure keeps
  the pin usable. Nominatim fallback uses explicit searches only, cached and
  serialized; public deployment needs a suitable provider.
- Four session-only dummy scenarios place observations on real returned OSRM
  geometry: clear roads, flooded fastest road, all exits flooded, cleared flood.
  Expected/outcome indicator and blocked-vs-selected paths make rerouting visible.
  Dummy observations are never submitted to the live incident API.
- Build passed; 19 frontend behavior tests and 21 backend unittest cases passed.
  Desktop verified Gwalior 10-minute route → 15-minute detour, blocked result,
  restored route after clearance, live Google traffic and satellite rendering,
  local report search/map selection/review, stale-place invalidation, menu Escape.
  Mobile/provider verification completed as recorded below.

### 9.2 Test and delivery
- Final: 19 Node tests, 21 Python unittest cases, production build, and diff
  whitespace checks passed. Lint has zero errors; legacy unused-code warnings
  and three map/search lifecycle warnings remain. Main JS is ~388 KB (119 KB gzip);
  map providers load separately and marker assets add ~2.5 KB.
- Browser checked Google light/dark, traffic colors, satellite imagery, layer
  controls, source/destination captions, large dummy warning, Gwalior reroute
  (10 min / 5.0 km → 15 min / 8.1 km), fully blocked and cleared scenarios.
- Verified explicit external search fallback returns Gwalior Junction from OSM;
  local search tolerates commas, case and word order. Editing invalidates the old
  route; unsupported-city selection clears both fields instead of retaining
  misleading metro names. Menu uses native modal focus management and Escape.
- Verified reporting with Gwalior suggestions, adjustable map pin, approximate
  address fallback and explicit review. The map pin is labeled Report location,
  not Destination. No test observation was submitted to the shared live API.
- Mobile 390 × 844: both themes, expanded/collapsed sheet, glanceable ETA,
  panel scroll reset, reporting modal/map, visible provider attribution and no
  horizontal overflow. Viewport override reset after testing. Google → OSM
  provider switching renders tiles; unsupported layers are disabled/explained.
- Screenshots: docs/jalmarg-maps-light.jpg, docs/jalmarg-maps-dark.jpg,
  docs/jalmarg-maps-mobile.jpg. Updated README has repeatable test steps.
- Current Google browser key has Maps JavaScript enabled but Geocoding disabled;
  broad search falls back to OSM and reverse lookup uses approximate local names.
  Enabling Geocoding requires a separate Google project configuration change.
  GPS city selection is behavior-tested with Gwalior coordinates; actual device
  permission/accuracy, camera and speech still require physical-device testing.
- Local API restarted with GWL/OTHER support on 127.0.0.1:3001; frontend is on
  127.0.0.1:5173. AWS infrastructure was not deployed during this UI rework.

- Final clean page reload and Gwalior dummy reroute produced no new browser console errors.

## 10. Vehicle timings, route advisory, city picker and photo assessment (2026-10-10)

### 10.1 Plan and implementation
- Followed ENHANCEMENT_PLAN.md and retained the existing Material consumer-map
  design. Added searchable themed area picker, keyboard selection/Escape and
  mobile stacking above connection badges and the journey sheet.
- Added Google Routes JS adapter: TWO_WHEELER for bikes; DRIVING for sedan/SUV;
  traffic-aware departure-now timing, real path/duration/distance and via-point
  detours. Existing segment geometry audit still selects routes. No fake vehicle
  multipliers. Sedan/SUV on the same road may legitimately share a time.
- Google failures fall back to an entirely OSRM-derived journey with explicit
  no-live-traffic/provider notice. SDK waits are bounded to 12 seconds, stale
  results are ignored on abort, and failures briefly suppress repeated requests.
- Browser confirmed exact Google error: PERMISSION_DENIED, Routes API disabled
  for the current browser key's project. Live Google ETA success remains unverified
  until Routes API/project restrictions/billing are configured. Maps JS rendering
  and visual traffic alone do not provide a traffic-aware route ETA.
- Corrected route choice: the fastest candidate below the selected vehicle's
  avoidance threshold wins; a below-threshold report no longer forces a slower
  SUV route just because another candidate has fewer reports.
- English/Hindi audio text now states vehicle, endpoints, avoided report/depth,
  original and selected time, added distance, provider and remaining hazards.
  Dummy mode is announced. Playback remains device speech, not Amazon Polly.
- Marker evidence now shows 2-wheeler/sedan/SUV assessments, current vehicle,
  20/30/55 cm prototype avoidance settings and provenance/uncertainty. Named
  road replaces raw coordinates. Below-setting observations require review;
  they are never presented as permission to cross.
- Replaced the old caption-keyword mock with an optional user-assisted photo
  reference workflow: known-height object, top/base/waterline marks, accessible
  sliders and explicit confirmation. This is image geometry, NOT automatic AI.
  Server validates/recomputes the estimate, retains unverified provenance and
  uses max(observed-level depth, photo-reference depth) for routing. No accuracy
  guarantee. Automatic CV/model deployment remains future work.

### 10.2 Build and test
- 28 Node behavior tests and 24 Python tests passed; production build passed.
  Lint reports zero errors with existing legacy/lifecycle warnings. Added tests
  cover actual Google mode/traffic fields, via points, timeout/abort, advisory
  explanation, inclusive vehicle settings, photo geometry validation, server
  recomputation/provenance/persistence and prevention of reduced observed depth.
- Desktop browser verified Gwalior dummy 2-wheeler detour 15 min/8.1 km versus
  SUV original route 10 min/5.0 km, accurate advisory text and marker assessment.
  Google disabled-API notice verified. Physical speech playback still needs a
  device check; no claim of successful Google ETA or automatic image analysis.
- Synthetic photo upload, keyboard marks (top .2/base .8/water .4), 60 cm reference
  and 40 cm result verified through report review in test mode. No synthetic
  observation was submitted to the shared live API.
- Both themes inspected. Mobile 390x844: picker search/keyboard selection,
  overlay stacking and no horizontal overflow checked; viewport reset afterward.
  Screenshot docs/jalmarg-city-mobile.jpg. Updated README with enablement and
  repeatable photo/vehicle test instructions.
- Local API restarted with photo-reference validation; no AWS deployment or
  Google project configuration change performed. Prior user changes in legacy
  ReportModal.jsx and whatsapp_webhook_server.py remain untouched.
- Final checks repeated after validation/mobile fixes: all 52 tests, build and
  whitespace checks pass; no browser console errors on the final marker flow.
  Additional screenshots: docs/jalmarg-city-desktop.jpg and
  docs/jalmarg-vehicle-assessment.jpg. API restarted with final validation.

## 11. Citizen and municipal identities (implementation underway)
### Phase 1: plan, audit, validation
- Audited current API, SQLite/DynamoDB repository, operator-only Cognito stack,
  PKCE client, public report writes and four-hour routing freshness.
- Recorded IDENTITY_IMPLEMENTATION_PLAN.md. Reuse one user pool, keep Cognito-owned
  signup/verification/recovery, server-authorized profiles and municipal membership.
- Existing records remain unclaimed; work history must outlive routing freshness.
- AWS identity verified; no JalMarg deployed stack exists. Unrelated existing stack
  will not be changed. Host has Python 3.14; AWS official runtime reference confirms
  python3.14 supported, allowing a native build instead of unavailable Docker/3.12.
### Phase 2: landing build and test
- Added responsive landing with actual product screenshot, public map entry,
  citizen and municipal actions, connected-response explanation and limitations.
- Retained Material Web buttons, existing logo/icons and blue semantic tokens.
- Production build + 28 frontend tests passed; desktop screenshot and public-map
  navigation verified in browser. Identity actions connected in the next phase.
### Phase 3: accounts build and test
- Generalized authorization-code+PKCE flow with state/nonce/audience/token-kind/
  verified-email/expiry checks. Cognito owns signup, confirmation and recovery.
  Tokens kept in memory; reload uses sign-in again (Cognito session can resume).
- Added authenticated profile APIs; caller identity comes from verified Cognito
  claims. Local backend validates real JWTs when configured, never role headers.
- Added account/sign-in screens and expiration/logout behavior.
- Build + 30 frontend tests passed. Seven identity/membership API tests passed,
  including unverified/expired/wrong-client claims and cross-user profile attempts.
  Live Cognito signup remains to be verified after Phase 8 deployment.
### Phase 4: municipal onboarding build and test
- Added authenticated access request with corporation/city/ward/employee identifier;
  request is always PENDING. Browser fields cannot grant membership or choose roles.
- Municipal authority requires approved stored membership AND Cognito group.
  Suspension in storage immediately denies even a previously issued group token.
- Added trusted AWS administrator CLI for approval/rejection/suspension. It checks
  verified email and state transitions; no public privilege-promotion endpoint.
- Pending/approved request screens built. Seven API tests cover forged approval,
  group without approval, approved profile without group and suspension.
### Phase 5: citizen reporting build and test
- New reports and evidence uploads require verified sign-in. Ownership is assigned
  by the backend from authenticated subject; reporterId/owner fields are ignored.
- Added private My reports across cities with persisted history/evidence. Old
  anonymous reports stay unclaimed. New work records have no DynamoDB TTL;
  routing still independently filters expiresAt.
- Added evidence ownership validation to prevent another account reusing uploads.
- Retired legacy /review mutations (410) so local operator tokens cannot bypass
  the municipal workflow. Updated old tests for the authenticated contract.
- 34 Python tests pass; frontend build passes. Covered anonymous write denial,
  owner spoofing, cross-user history and evidence reuse; public browsing retained.
### Phase 6: municipal workspace build and test
- Added jurisdiction-scoped incident queue/map, reported-depth priority, search,
  open/mine/review/history filters and approved-worker assignment.
- Implemented review, assignment, start, reject and duplicate linking with notes,
  actor audit trail, expected-version checks and city/assignee enforcement.
- Invalid/duplicate work classification does not silently clear road conditions.
- Work stays visible after observation expiry. Public responses hide owner and
  assignment account IDs; municipal response includes assignment for authorized use.
- 41 Python tests + production build pass, including city boundaries, unapproved
  assignees, starting another worker's task, stale writes and duplicate self-links.

### Phase 7: resolution build and test
- Completion requires an account-owned after-photo uploaded after task start and a
  work note. Another approved worker in the city must review before resolution.
- Evidence older than four hours cannot clear current road conditions. Citizen
  feedback can reopen resolved work; recession alone never grants clearance.
- Preserved previous completion evidence when work is completed again, with private
  account IDs excluded from public views. Evidence retention is ninety days.
- 43 Python tests, 32 frontend tests and production build pass; includes stale
  evidence, stale review, self-review denial and citizen reopening.
- Phase 8: build, isolated AWS deployment and live checks now underway.

### Phase 8: deployed and verified (11 October 2026)
- Deployed isolated jalmarg-api + jalmarg-web in ap-south-1. Unrelated existing
  application stack untouched. Frontend: https://d2vv0vxqbvoy73.cloudfront.net/.
- Hosting uses private encrypted/versioned S3, CloudFront OAC, HTTPS and managed
  security headers. Cognito callback and API CORS match the deployed origin.
- Pinned boto3 1.43.111 / PyJWT crypto 2.15.1; built native Python 3.14 Lambda
  artifacts, verified Linux libraries, SAM lint and reviewed CloudFormation changes.
- Fixed live-only API Gateway formatted-expiry handling without weakening local
  JWT verification; regional S3 SigV4 URLs now load without redirect/signature failure.
- Kept mutation errors visible across polling. Default citizen display name no
  longer exposes email; authenticated account display-name editing added.
- Live synthetic tests passed for Cognito/profile/application/approval, anonymous
  denial, city scope, ownership, private photos, DynamoDB indexes, Step Functions,
  durable work, assignee-only actions, fresh completion evidence, independent review
  and citizen reopening. Signed S3 returned 200; unsigned access returned 403.
- Browser verified citizen submission and municipal review → assign → start →
  upload after-photo → submit → approve as another worker → resolved. Prior
  completion history remains visible. Corrected misleading resolved-task copy.
- Desktop and 390px mobile landing/workspace visually checked; saved proof under
  docs/jalmarg-*.jpg. Citizen and completion photos load in evidence dialog.
- Final checks: 47 Python tests, 32 frontend tests, production build, lint (warnings
  only), SAM lint and git diff --check passed. Backend UPDATE_COMPLETE; hosting
  CREATE_COMPLETE; API health and frontend 200. Details: docs/identity-verification.md.
- Removed all synthetic users/reports/profiles/evidence metadata and S3 versions;
  verified zero remaining fixture resources. Deleted temporary credentials and
  signed out test browser session. Normal cloud audit logs remain retained.
- Real inbox signup verification/recovery delivery remains untested (fixtures
  intentionally suppressed email). CloudFormation Guard unavailable. Existing Google
  Routes API remains disabled; UI truthfully uses OSRM driving fallback without live
  traffic/two-wheeler ETA. Municipal permission scope is city, ward is descriptive.
- README/DEPLOYMENT include live configuration, trusted membership administration,
  local dependency setup and verification limits. No GitHub publish in this phase.
