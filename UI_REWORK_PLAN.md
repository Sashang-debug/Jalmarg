# Maps interface rework: plan → build → test

## Audit and design
The previous UI devoted too much space to a headline, hid map controls, replaced
recognizable pins with A/B circles, and tied report suggestions to the selected
metro rather than the observed location. Restore the map as the main workspace.
Keep the shared API, audit history, consent and explicit demo separation.
Design: Material consumer navigation; variance 3, motion 2, density 6. Use the
official Material Web package for core actions and switches; retain existing
Lucide icons. Replace the waves logo with a compact navigation-pin wordmark.

## Build
1. City/location utilities including Gwalior and locations outside known metros;
   place search, reverse geocoding, current-location city correction; no normal
   latitude/longitude entry. Report map picker with confirmation.
2. Compact directions/search panel, collapsible rail/menu, large source/destination
   labels, identifiable flood warning pins; light/dark/auto; live Google traffic,
   transit, terrain/satellite and recenter controls with honest fallback behavior.
3. Explicit dummy scenarios using actual fetched street geometry: clear route,
   flooded fastest route, all routes blocked and cleared flood. Show expected vs
   actual outcomes, avoid writing dummy reports to the shared live backend.

## Test
Route/city behavior tests, backend Gwalior report round-trip, frontend build/lint,
then browser tests of both themes, provider layers, Gwalior search/report picker,
marker readability, dummy outcomes and mobile layout. Update agent.md after phases.

## Completion
Built and tested. Final evidence and limitations are recorded in agent.md §9.
19 frontend behavior tests and 21 backend unittest cases pass; build/lint pass
with warnings only. Desktop and 390 × 844 browser checks cover themes, layers,
real Gwalior rerouting with dummy floods, reporting/map selection and fallback.
