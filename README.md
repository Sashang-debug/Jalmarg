# JalMarg — Know the road ahead

A waterlogging reporting and route-advisory prototype for two-wheeler commuters.
Built for the **Heat and Water** track. The current flow is: citizen observation →
shared incident → municipal review and assignment → evidence-backed completion →
independent resolution review → citizen follow-up.

Live application: [Open JalMarg](https://d2vv0vxqbvoy73.cloudfront.net/).

## Run locally

In the repository root:

```sh
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/src/requirements.txt
backend/.venv/bin/python backend/local_server.py
```

The API binds to `127.0.0.1:3001`, persists reports in `data/local/`, and prints
an account configuration notice. Public browsing works without authentication; new
reports, photos and observations require verified Cognito sign-in. In another terminal:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Use `/api` for `VITE_API_BASE_URL`; Vite proxies it to
the local server. Public browsing needs no AWS credentials or LocalStack. For authenticated local
writes, configure `USER_POOL_ID`, `OPERATOR_CLIENT_ID`, `AWS_REGION` on the API and
a Cognito callback/client configuration matching the frontend origin. The API
validates real JWT signatures; there is no development-role bypass.
Optional settings are documented in `frontend/.env.example`. Browser-visible
`VITE_*` variables must never contain AWS credentials. Google Maps keys need
website restrictions; Leaflet/OpenStreetMap is available without a Google key.

## What works

- Persistent shared reports with four-hour active lifetime, evidence photos,
  status history, and follow-up observations. Photo re-encoding removes original EXIF.
- Citizen landing, Cognito signup/sign-in, verified-email accounts and private My reports.
- Municipal applications start pending. A trusted administrator verifies corporation,
  city, ward and employee details; permissions require both approval and Cognito group.
- City-scoped municipal workspace: queue/map, depth-based priority, duplicates,
  assignment, work notes and version-controlled audit history.
- Completion requires a recent account-owned after-photo and another approved worker's
  review. Citizens can reopen resolved incidents. Work history survives routing expiry.
- Google traffic-aware routing when Routes API is enabled, with explicit real OSRM
  driving fallback, segment-by-segment report checks, audited alternatives,
  and explicit unavailable/blocked states. Failed requests never invent a route.
- Google Maps or Leaflet; compact directions, named source/destination pins, large
  flood warnings, mobile bottom sheet, light/dark/system themes, place search and
  Gwalior-aware GPS reporting. No coordinate entry in the normal report flow.
- Real Google traffic/transit/terrain/satellite layers and satellite-label toggle.
  Traffic overlay and ETA provider are separate. Google ETAs use traffic-aware
  departure-now requests; fallback ETAs clearly exclude live traffic.
- Session-only dummy flood scenarios on real fetched roads, with expected/outcome
  indicators. English/Hindi route advisories explain avoided floods and time/distance
  changes. Searchable themed city picker and keyboard-accessible dialogs.
- Optional photo reference depth estimate, server-side recomputation and provenance;
  marker details compare two-wheeler, sedan and SUV avoidance settings.
- AWS SAM infrastructure for API Gateway/Lambda, DynamoDB, private S3,
  Step Functions, Cognito accounts, logs, tracing, and a failure alarm.
- Private S3 + CloudFront HTTPS frontend hosting in a separate stack.

See [DEPLOYMENT.md](DEPLOYMENT.md) for actual cloud status, account administration
and verification results. Local health explicitly identifies SQLite.

## Verify

```sh
PYTHONPATH=.aws-sam/build/IncidentApiFunction python3 -m unittest discover -s tests -v
python3 tests/test_phase2_intelligence.py
python3 tests/test_phase3_spatial_and_plumbing.py
cd frontend
npm test
npm run lint
npm run build
cd ..
sam validate --lint --template-file backend/template.yaml
```

The identity implementation passes 47 Python tests and 32 frontend tests. Build and
lint pass; legacy components still produce lint warnings. Per-phase outcomes and
live deployment checks are recorded in `agent.md` and `DEPLOYMENT.md`.

## A focused judge demo

1. Start on the landing page; explore the public map without signing in.
2. Sign in as a citizen, submit an observation and show it in My reports.
3. Show an access request remaining pending; explain administrator verification.
4. Sign in as an approved worker, review the city queue, assign and start work.
5. Submit an after-photo and work note. Show that this alone does not clear the road.
6. A second approved worker reviews completion; citizen history shows the result.
7. Citizen feedback can reopen an issue. Old observations expire independently of work.
8. Use **Test routes** for session-only dummy floods on real fetched roads; explain
   provider ETA limitations, vehicle profiles and route rationale honestly.
9. Show the actual Step Functions execution and CloudWatch request logs.

## Scope and honesty

Water levels are verbal observations mapped to approximate avoidance values,
not measured depths or vehicle safety certifications. All vehicle profiles use
OSRM driving estimates. No reports does not mean no flooding. Public browser IDs
reduce accidental duplicate follow-ups but do not establish human identity.
Public submission and evidence viewing need stronger abuse/privacy controls before
an unrestricted public launch. AWS storage is private; app viewers receive short-lived
signed evidence URLs. The local server is loopback-only development infrastructure.

Earlier AI/CV, OpenSearch, Polly, prediction, pump-dispatch and WhatsApp modules
remain as **legacy experiments**, including the user's existing WhatsApp edits.
They are not part of the new verified reporting journey. No trained CV accuracy,
automatic verification, municipal dispatch, or deployed AI is claimed.
`JALMARG_BLUEPRINT.md` is a vision document; sections 8–9 of `agent.md` is the current
implementation record. Docker/LocalStack configurations belong to the older experiments.

The fallback uses standard OpenStreetMap raster tiles for modest interactive
viewing, with visible attribution and browser caching. Follow the
[OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/);
use an appropriate hosted provider for a larger public deployment.

## Test the new map interface

Start in Gwalior (IIITM Campus → Railway Station), then click **Test routes**.

| Dummy scenario | Expected result |
| --- | --- |
| Clear roads | Original returned street route is selected. |
| Flooded fastest road | Bikes/cars avoid the 50 cm dummy observation, or show no alternative. |
| All exits flooded | A 75 cm dummy at the common starting road blocks all returned routes. |
| Flood cleared | Cleared observation no longer affects the original route. |

The browser check produced 10 min / 5.0 km for the initial Gwalior route and
15 min / 8.1 km for its flood-avoiding alternative. These are test-run observations,
not guaranteed timings. Blue is selected; red is affected geometry. Use vehicle
buttons to compare prototype avoidance thresholds. Exit the test lab to return to
shared live observations. Refresh resets all dummy data.

For reports, use GPS, a named place or a map pin, then check its road name before
continuing. GPS coordinates determine the city even when the previously selected
city was Mumbai. Gwalior suggestions include IIITM, station, DB City Mall and
Phool Bagh; unknown areas use general search/map selection. Curated landmark pins
are approximate suggestions, not entrance-level geocodes.

Google address search needs the Geocoding API enabled for the browser key. If it
is unavailable, explicit searches fall back to OpenStreetMap and reverse lookups
retain a usable pin with a local approximate label. Nominatim requests are cached
and serialized, with no remote autocomplete on keystrokes, per the
[public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/).
Use a suitable hosted/self-managed geocoder for a public deployment.

UI screenshots: `docs/jalmarg-maps-light.jpg`, `docs/jalmarg-maps-dark.jpg`,
`docs/jalmarg-maps-mobile.jpg`. Physical-device GPS permission/accuracy, camera and
audio still need a device check. Browser tests use public landmarks and map pins;
they do not request the user's private location.


## Vehicle timings and photo estimates

Google Maps JavaScript renders the map; **Routes API must also be enabled** for
traffic-aware journey timings. Enable Routes API in the browser key's Google Cloud
project, permit it in the API restrictions, confirm billing and website restrictions,
then reload the app. The current key returned `PERMISSION_DENIED: Routes API disabled`
in browser testing. Until enabled, the app uses real OSRM road estimates and explicitly
labels the absence of live traffic. The Google adapter and request fields are unit-tested;
successful Google ETAs remain pending that project configuration.

Two-wheelers request Google's `TWO_WHEELER` mode. Sedan and SUV request `DRIVING`;
Google does not offer separate sedan/SUV ETA modes, so the same road may have the same
time. Flood avoidance settings may select different roads. No vehicle time multipliers
or fabricated traffic delays are used. See the [Google Routes reference](https://developers.google.com/maps/documentation/javascript/reference/route).

Click a waterlogging marker to compare vehicle assessments. These are prototype
avoidance settings (20/30/55 cm), not certified vehicle wading limits. The 50 cm dummy
scenario produced a 15-minute bike/car detour versus a 10-minute SUV route during
local testing; road and provider responses can change.

To estimate from a photo, upload it in the Observation step, mark the reference top,
its base at road level, and the waterline on the same vertical object. Enter its known
height, confirm the reference, and choose **Use approximate photo estimate**. Sliders
provide a keyboard alternative. For example, normalized top 0.2, base 0.8, waterline
0.4 and a 60 cm height yield 40 cm. Review shows the result; submitted marker details
retain its source. The API recomputes depth from the marks and uses the higher of the
reference estimate and verbal observation for routing. It rejects invalid geometry
or an estimate without an attached photo.

This is user-assisted image geometry, **not automatic computer vision**. The older
caption-based mock is not used. Perspective and reference accuracy remain unverified;
no centimetre-accuracy or safe-crossing claim is made. Browser-tested upload/review
used a synthetic fixture in test mode without publishing a fake report. Automated
API tests verify persisted photo estimate and vehicle-routing depth.
