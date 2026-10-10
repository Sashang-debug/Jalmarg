# JalMarg deployment and account administration

The isolated `jalmarg-web` and `jalmarg-api` stacks are deployed in `ap-south-1`.
The existing unrelated application stack is unchanged.

Live frontend: https://d2vv0vxqbvoy73.cloudfront.net/
API: https://2wqkiapywa.execute-api.ap-south-1.amazonaws.com/prod

The live smoke workflow passed real Cognito login, pending-only applications,
administrator approval, city boundaries, report ownership, private signed photos,
DynamoDB persistence, Step Functions processing, assignment, after-photo submission,
independent resolution review and citizen reopening. Browser checks are recorded
in agent.md. Two cloud-only defects were fixed: REST Gateway's UTC expiry claim
format and S3 regional-host signing. Offline regressions cover both. No zero-cost guarantee: pay-per-request storage,
API, workflow and hosting resources incur AWS usage charges.

## Infrastructure

`backend/hosting.yaml`: private encrypted S3 origin, CloudFront OAC restricted by
SourceArn, HTTPS redirect, managed security headers, retained/versioned releases.
`backend/template.yaml`: Python 3.14 Lambda, API Gateway/Cognito authorizer,
DynamoDB profiles/incidents and sparse citizen/worker indexes, private S3 evidence,
Step Functions, fourteen-day logs and API failure alarm (no notification subscriber).

New work/profile records have no TTL. Four-hour `expiresAt` governs routing only.
Evidence and upload ownership expire after ninety days. Table, evidence bucket,
user pool and frontend bucket are retained if their stacks are deleted. Older
anonymous reports remain unclaimed. City permissions are enforced server-side;
ward is stored as service-area information, not a polygon authorization boundary.

## Build and deploy

```sh
sam validate --lint --template-file backend/hosting.yaml
sam validate --lint --template-file backend/template.yaml
sam build --template-file backend/template.yaml
```

Dependencies are pinned. SAM resolves Linux wheels even on this macOS host;
artifact native libraries were verified as ELF x86-64. Docker is not required here.
CloudFormation Guard is unavailable; Guard compliance checks have not run.
Template lint and account-aware change-set validation run before execution.

Deploy hosting first with a reviewed CloudFormation change set. Use its
`FrontendOrigin` output for the backend parameter, CORS and exact Cognito callback:

```sh
sam deploy --template-file .aws-sam/build/template.yaml --stack-name jalmarg-api \
  --region ap-south-1 --resolve-s3 --capabilities CAPABILITY_IAM \
  --parameter-overrides FrontendOrigin=https://YOUR_DISTRIBUTION.cloudfront.net \
  --no-execute-changeset
```

Review resource additions/replacements before executing the returned change set.
Read outputs using `aws cloudformation describe-stacks --stack-name jalmarg-api`.
Build the frontend with `VITE_API_BASE_URL`, `VITE_COGNITO_CLIENT_ID`,
`VITE_COGNITO_DOMAIN`, `VITE_AWS_REGION`; these are public configuration, never AWS
credentials. Upload `dist/` to the hosting bucket, with index.html no-cache and
hashed assets immutable. Invalidate CloudFront after each release.

Google's browser key must allow the deployment hostname and enabled map/routing
APIs. The provider and ETA limitations remain described in README. Leaving its key
empty uses Leaflet/OpenStreetMap and real OSRM driving estimates.

## Accounts and municipal approval

Citizens self-register through Cognito and verify their email. Password recovery
is Cognito-owned. Code + PKCE validates state, nonce, audience and token expiry;
API Gateway independently verifies signatures. Tokens remain in memory, so reload
requires sign-in again (the Cognito session can resume). Session expiry is fifteen
minutes. Logout invokes global sign-out and clears the hosted session.

Municipal applicants submit corporation, city, service area and employee ID.
The request stays PENDING until a trusted AWS administrator verifies it:

```sh
python3 backend/manage_membership.py --table TABLE_OUTPUT --pool POOL_OUTPUT \
  --username VERIFIED_ACCOUNT_EMAIL --action APPROVE \
  --reason 'Verified corporation and employment details' --region ap-south-1
```

The same CLI supports REJECT (pending request) and SUSPEND (approved membership).
Suspension denies API access immediately through stored membership checks, even
with a previously issued group token. Approval requires stored membership AND
`civic-operators` group; sign in again after approval. Browser fields cannot assign
roles. Do not approve a real applicant solely because an email is verified.

## Repeatable live smoke checks

`backend/scripts/smoke_cloud.py` creates explicitly synthetic accounts, suppresses
email delivery and keeps temporary credentials in a 0600 file outside the repo.
Run only against the intended test/pilot stack:

```sh
PYTHONPATH=.aws-sam/build/IncidentApiFunction python3 backend/scripts/smoke_cloud.py --setup
PYTHONPATH=.aws-sam/build/IncidentApiFunction python3 backend/scripts/smoke_cloud.py --exercise
# After browser checks:
PYTHONPATH=.aws-sam/build/IncidentApiFunction python3 backend/scripts/smoke_cloud.py --cleanup
```

Checks cover API authentication, real Cognito tokens, pending-to-approved access,
city boundaries, private ownership, signed S3 evidence, actual Step Functions,
work surviving routing expiry, assignee enforcement, fresh after-photo, independent
review and citizen reopening. Admin-created fixtures do not verify real inbox
signup/confirmation/recovery delivery. Those need a real user's email check.

Before wider use, add submission-abuse controls, pagination/load testing, a formal
municipal verification process and an evidence-retention policy agreed with users.
