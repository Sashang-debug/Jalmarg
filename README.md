# JalMarg (जलमार्ग) 🌊
### Autonomous Urban Flood-Depth Intelligence & Monsoon Navigation Protocol

[![Track](https://img.shields.io/badge/Track-Heat%20%26%20Water-blue.svg)](https://github.com/Sashang-debug/Jalmarg)
[![Theme](https://img.shields.io/badge/Theme-Build%20for%20Bharat%20(AWS)-orange.svg)](https://github.com/Sashang-debug/Jalmarg)
[![Architecture](https://img.shields.io/badge/Architecture-Serverless%20%2B%20LocalStack-brightgreen.svg)](https://github.com/Sashang-debug/Jalmarg)
[![License](https://img.shields.io/badge/License-Apache%202.0-lightgrey.svg)](LICENSE)

---

## 📌 Executive Summary

During Indian monsoons, major metros (Bengaluru, Mumbai, Delhi-NCR, Chennai) grind to a halt due to flash waterlogging. Commuters rely on mainstream navigation apps that only show generic congestion (*"Dark Red Traffic"*), leaving riders completely blind to whether a road is simply slow or submerged under 3 feet of water. This leads to hydro-locked engines, stranded delivery workers, and blocked emergency services.

**JalMarg (जलमार्ग)** is an autonomous, event-driven flood intelligence and safe-navigation platform. It converts unstructured citizen photos, social media chatter, WhatsApp voice notes, rainfall telemetry, and traffic sensors into **centimeter-accurate water-depth maps ($\pm 5\text{ cm}$)**. It calculates vehicle-tailored dry routes and triggers automated municipal de-watering pump dispatches.

---

## 🚀 Key Innovations

1. **Social Media OSINT Flood Radar**:
   - Autonomous multi-agent pipeline monitoring X (Twitter), Reddit (`r/bangalore`, `r/mumbai`), and local channels 45–60 minutes before official civic announcements.
   - Multilingual Named Entity Recognition (NER) powered by Amazon Bedrock for colloquial Indian landmarks (*"Sony World Signal"*, *"Indiranagar 100ft road underpass"*).

2. **Computer Vision Water-Depth Estimation Engine**:
   - Analyzes submergence indicators from images (tire rim submersion $\approx 15\text{ cm}$, exhaust/pedals $\approx 30\text{–}35\text{ cm}$, median dividers $\approx 50\text{–}70\text{ cm}$).

3. **Vehicle-Profile-Tailored Safe Routing**:
   - Differentiated clearance thresholds:
     - **2-Wheeler (Motorcycle/Scooter)**: Critical cutoff at $18\text{ cm}$.
     - **Sedan / Hatchback**: Critical cutoff at $28\text{ cm}$.
     - **SUV / Commercial Bus**: Critical cutoff at $45\text{ cm}$.

4. **Hands-Free Vernacular Audio Radar**:
   - Amazon Polly neural text-to-speech providing turn-by-turn flood warnings in Hindi, Kannada, Tamil, and English for two-wheeler gig riders operating in torrential rain.

5. **Fine-Grained Governance with Cedar Policy**:
   - Strict role-based safety gates preventing unauthorized incident overrides or emergency pump dispatches without verified sensor thresholds.

6. **Automated Civic Pump Dispatch**:
   - AWS Step Functions state machine linking verified critical waterlogging incidents directly to BBMP/BMC municipal ward de-watering pump units.

---

## 🏗️ Master Architecture

```
[ Citizen Photos / Social Media / WhatsApp Audio / Rain Gauges ]
                           │
                           ▼
          [ Multimodal Ingestion Layer (API Gateway) ]
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[ Amazon Bedrock / NER ]              [ CV Depth Estimator ]
(Colloquial Landmark Resolution)       (Submergence Marker Analysis)
       │                                       │
       └───────────────────┬───────────────────┘
                           ▼
          [ Cedar Policy Authorization Engine ]
                           │
                           ▼
      [ EventBridge / AWS Step Functions Orchestration ]
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[ Amazon OpenSearch & DynamoDB ]      [ Municipal Civic Dispatch ]
 (Geospatial Index & Spatial Query)   (Automated Pump Work Tickets)
       │
       ▼
[ Vehicle-Tailored Routing & Polly Audio Radar Frontend ]
```

---

## 📁 Repository Structure

```
.
├── JALMARG_BLUEPRINT.md            # Complete architecture & judging rubric
├── agent.md                        # Living playbook and implementation logs
├── agents/                         # Autonomous agents
│   ├── strands_osint_agent.py      # Multi-agent OSINT scraper & monitor
│   ├── cv_depth_estimator.py       # Visual submergence & depth analyzer
│   └── landmark_resolver.py        # Amazon Bedrock Indian NER resolver
├── backend/                        # Cloud & Serverless backend
│   ├── src/
│   │   ├── ingest_incident.py      # Incident ingestion Lambda
│   │   ├── query_incidents.py      # Spatial query Lambda
│   │   ├── route_engine.py         # Dynamic vehicle-clearance routing
│   │   ├── spatial_index.py        # OpenSearch geo_shape manager
│   │   ├── polly_audio.py          # Polly multilingual audio synthesizer
│   │   └── whatsapp_voice_handler.py # Transcribe voice-note pipeline
│   ├── step_functions/             # Step Functions incident pipeline
│   ├── template.yaml               # AWS SAM Infrastructure as Code
│   └── requirements.txt            # Python backend dependencies
├── policies/                       # Cedar governance & authorization
│   ├── jalmarg_policies.cedar      # Formal Cedar policy definitions
│   └── cedar_evaluator.py          # Python Cedar evaluation engine
├── frontend/                       # Interactive Flood Radar Web Application
│   ├── src/                        # React + Leaflet + Tailwind/Vanilla CSS
│   ├── package.json
│   └── vite.config.js
├── docker/                         # Container runtimes & worker definitions
│   ├── Dockerfile.worker
│   └── docker-compose.yml
└── tests/                          # Automated test suites
    ├── test_phase2_intelligence.py
    └── test_phase3_spatial_and_plumbing.py
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Docker / Finch (optional for LocalStack container emulation)
- AWS CLI configured or LocalStack

### 2. Backend & Agent Setup
```bash
# Set up virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Run Backend Verification Tests
```bash
python3 -m unittest discover tests/
```

### 4. Frontend Client
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to access the live flood navigation interface.

---

## 🇮🇳 Built for Bharat
Engineered for the **AWS x WeMakeDevs Build for Bharat Hackathon** under the **Heat and Water** track.
