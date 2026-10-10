# Vehicle-aware journeys and photo evidence: plan → build → test

1. Add Google Routes traffic-aware adapter (TWO_WHEELER vs DRIVING), preserving real
   geometry flood auditing and explicit OSRM fallback. Never multiply times to fake
   different vehicles. Sedan/SUV use the same driving mode but different flood settings.
2. Audio describes selected vehicle, endpoints, avoided reports, changed time/distance,
   remaining hazards, timing provider and dummy mode. Support English/Hindi text.
3. Replace native city select with themed searchable accessible area picker.
4. Add photo-reference depth estimation using a known object height and three image
   marks. Server recomputes the estimate and keeps its provenance; evidence shows all
   vehicle settings, uncertainty, expiry and current selected vehicle. Legacy caption
   mock is not promoted to AI image inference.
5. Behavioral tests, backend validation/persistence tests, build/lint and browser desktop/
   mobile checks. Record outcomes and provider limitations in agent.md.

Completed locally: all five implementation/verification steps. 28 frontend and
24 Python tests pass, build passes, lint has zero errors. Browser checks cover
both themes, mobile/keyboard city selection, vehicle-route differences, detour
advisory and reference-photo estimate through review. Google Routes API is disabled
for the current key: successful live Google ETA awaits external configuration.
Automatic CV is not implemented; the working photo estimator uses user-marked
known-height reference geometry. See agent.md section 10 and README test steps.
