# Citizen and municipal identities: plan, build, test

Design: extend the existing Material interface. Landing uses light/system theme,
blue accent, left-aligned headline + actual map screenshot, restrained motion.
Design dials: variance 4, motion 2, density 4. Existing product UI stays intact.

1. Audit: preserve real map/routing/photo behavior and legacy report edits.
   One Cognito user pool, public citizen registration, verified municipal membership.
   Cognito handles passwords, email verification and recovery via code+PKCE login.
   Profile/jurisdiction/application data stored separately. Never trust submitted roles.
2. Landing: responsive entry, public map, citizen signup, municipal access.
3. Accounts: generalized existing PKCE flow, nonce/state/expiry validation, profile API,
   memory-only tokens, logout/session expiry. Browsing public; writes require login.
4. Municipal requests: authenticated application, pending by default; trusted admin
   CLI approval, corporation+city+ward, rejection and suspension. No public promotion.
5. Citizen reports: identity from authenticated context, My reports across cities,
   persistent history; old anonymous reports stay unclaimed.
6. Municipal work: jurisdiction-scoped queue, map, priority, duplicate linkage,
   approved-worker assignment, optimistic version writes and full audit events.
7. Resolution: after-photo+note, review before closure, fresh verified clearance,
   citizen feedback can reopen, freshness independent from work status. Staff cannot
   approve their own completion. Work survives observation expiry.
8. Deploy/test: isolated JalMarg AWS stack (not other app stacks), pinned dependencies,
   exact CORS/callback, private evidence, retained identity/work data, actual AWS smoke
   tests and browser desktop/mobile validation. No fabricated adoption or accuracy.

Tests per phase and results recorded in agent.md. Live resources only after code and
checks are reviewable. No publishing to GitHub implied by this implementation request.
