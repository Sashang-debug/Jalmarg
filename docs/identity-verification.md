# Citizen and municipal workflow verification

Tested 11 October 2026 (Asia/Kolkata).

- 47 Python tests passed with built AWS SDK dependencies; no skipped tests.
- 32 frontend tests passed. Production build and lint passed (legacy warnings remain).
- Backend and hosting SAM lint passed. Linux native wheel format verified.
- Isolated jalmarg-api and jalmarg-web stacks deployed in ap-south-1.
- Live Cognito tokens, persisted profiles, pending-only membership application and
  trusted approval checked. Public citizen requests cannot choose municipal roles.
- Anonymous mutations denied; city boundaries, server-derived ownership and
  cross-account evidence rejection checked against the real API.
- Real DynamoDB records, sparse owned-report index and Step Functions execution checked.
- Signed regional S3 photo returned 200; unsigned access returned 403.
- Expired road observations leave the municipal queue intact.
- Assignee-only start/completion, fresh owned after-photo, independent reviewer,
  resolution and citizen reopening checked end to end.
- Browser: hosted login/signup page, citizen sign-in, signed report submission,
  approved-worker role routing, queue, review, assignment, start, real after-photo
  upload, completion submission and approval by a different signed-in worker.
- Citizen and completion evidence images loaded successfully in the browser.
- Desktop and 390px mobile landing/workspace visually checked; no horizontal overflow.
- Fixed live REST-authorizer formatted expiry parsing, regional S3 signing,
  persistent action errors, email-free default display names and resolved-task wording.
- Removed all synthetic Cognito users, reports, profiles, evidence metadata and S3
  object versions. Verified zero remaining table records and evidence versions;
  temporary credential file deleted. Cloud audit logs retain normal audit history.
- Final API health and frontend return 200; backend UPDATE_COMPLETE and hosting
  CREATE_COMPLETE. Latest frontend invalidation: I8E95TGW7LYTS1BTZCR3X0JE51.

Screenshots: `jalmarg-landing.jpg`, `jalmarg-landing-mobile.jpg`,
`jalmarg-citizen-submission.jpg`, `jalmarg-municipal-desktop.jpg`,
`jalmarg-municipal-mobile.jpg`, `jalmarg-municipal-evidence.jpg`,
`jalmarg-resolution-verified.jpg`. Screenshots show disposable synthetic fixtures
that have now been removed from the deployed application.

Real inbox signup verification and password-recovery delivery have not been tested;
fixtures use trusted admin provisioning with email delivery suppressed. CloudFormation
Guard is unavailable. Google map rendering works on the live domain; Google Routes
API is disabled for the existing key, so the UI labels real OSRM driving fallback
and absence of traffic/two-wheeler ETA accurately.

Live frontend: https://d2vv0vxqbvoy73.cloudfront.net/
