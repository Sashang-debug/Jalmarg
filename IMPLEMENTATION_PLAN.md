# JalMarg improvement plan — 10 October 2026

## Goal
Deliver a credible shared report → operator review → route-change journey for
two-wheeler commuters, with visible evidence, durable persistence, and AWS-ready
infrastructure. Preserve the existing WhatsApp work. Do not claim image inference,
municipal dispatch, or measured depth accuracy that the implementation cannot prove.

## Plan → build → test

1. **Incident platform:** Define one API contract for SQLite local development and
   DynamoDB/S3 on AWS. Validate observations and evidence; persist an audit trail;
   protect review actions with Cognito on AWS and an explicitly local operator token.
   Wire a real Step Functions processing workflow. Test persistence, concurrency,
   authorization, invalid inputs, expired reports, and evidence upload.
2. **Routing:** Audit actual street segments and every alternative; discard stale
   geometry and failed detours. Separate route availability from reported exposure.
   Fix conditional map hooks. Test curved roads, expiry, blocked alternatives,
   threshold boundaries, and failed routing.
3. **Experience:** Original midnight JalMarg shell, responsive journey panel/mobile
   sheet, three-step reporting, evidence detail and chronology, operator workspace,
   honest connection states and browser audio. Test desktop/mobile rendering and
   keyboard interaction; retain map-provider settings.
4. **Delivery:** Run backend tests, route tests, lint, build, infrastructure validation,
   and two-session end-to-end checks. Update agent.md and README with exact status,
   reproducible commands, demo sequence, and deployment limitations.

## Scope boundaries
No automatic pump dispatch or unsupported centimeter-accuracy guarantees. Public
reports are observations awaiting operator review. Citizen receded-water updates
request a review rather than clearing a road automatically. Recorded scenarios are
labeled. AWS deployment is prepared and validated before creating cloud resources.

## Verification result
Implemented all four local phases. Behavior checks, production frontend build, lint,
SAM lint validation and two-tab desktop/mobile browser verification pass. Cloud
packaging requires Python 3.12 or Docker; cloud deployment, Cognito and AWS repository
runtime smoke checks remain pending. See agent.md section 8 and DEPLOYMENT.md.
