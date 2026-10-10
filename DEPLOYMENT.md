# AWS deployment and verification

## Current state

AWS CLI authentication was verified for the configured default profile in
`ap-south-1`; IAM simulation allowed the main deployment actions. This does not
prove service quotas, organization policies, or deployment success. No resources
were created during this improvement pass.

SAM lint validation passed. `sam build` is currently blocked because the host has
Python 3.14 but the template targets Python 3.12. Install Python 3.12 on PATH, or
use SAM's container build with a running compatible Docker environment. CloudFormation
Guard is also absent; its security/compliance checks have not run. Do those checks
before deploying. No zero-cost guarantee is made.

## Prepare and review

```sh
aws sts get-caller-identity
sam validate --lint --template-file backend/template.yaml
sam build --template-file backend/template.yaml
# Alternative with a running Docker environment:
# sam build --use-container --template-file backend/template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

Choose region `ap-south-1`, a unique stack name, and the exact `FrontendOrigin`
(no trailing slash). Enable change-set confirmation and review its resource list
before execution. Lambda roles require IAM capability acknowledgement. Deployment
creates API Gateway, two Lambda functions, DynamoDB, private S3, Cognito, a workflow,
logs and an alarm. A frontend hosting stack is not included: serve the built Vite
`dist/` over HTTPS using your chosen host, then set its origin for CORS and Cognito.
For an initial local-to-cloud test, `http://127.0.0.1:5173` may be the exact origin.

Table, evidence bucket and user pool have retention policies. Deleting the stack
retains them; remove retained resources separately only after reviewing their data.

## Configure the frontend

Read stack outputs:

```sh
aws cloudformation describe-stacks --stack-name YOUR_STACK --query 'Stacks[0].Outputs'
```

In ignored `frontend/.env.local`, set:

```dotenv
VITE_API_BASE_URL=VALUE_OF_JalMargApiUrl
VITE_COGNITO_CLIENT_ID=VALUE_OF_OperatorClientId
VITE_COGNITO_DOMAIN=VALUE_OF_OperatorAuthDomain
```

Restart Vite or rebuild for hosting. Never put AWS access keys in frontend variables.
Create a named operator in the Cognito console, complete its initial sign-in/password
setup yourself, and add it to the `civic-operators` group. Public self-registration
is disabled. The app uses authorization code + PKCE and holds the ID token only in
memory. API Gateway verifies the token; the backend checks client and group membership.

## Required cloud smoke checks

1. GET `/health`: mode must be `aws`, storage `DynamoDB + private S3`.
2. POST an explicitly synthetic report through the UI. Check its DynamoDB item,
   real Step Functions execution and `NEEDS_REVIEW` audit event. Async processing
   initially returns `REPORTED`; polling picks up the later status.
3. Upload a synthetic JPEG/PNG/WebP. Confirm S3 public access is blocked, the
   evidence viewer uses a signed URL, and an unsigned S3 GET is denied.
4. Open a second session and refresh. Confirm the same incident remains.
5. Verify unauthenticated review is denied. Sign in as the provisioned operator;
   confirm, create a ticket, clear, and verify the shared timeline and map update.
6. Check expiration, routing failure and Cognito token expiry states.
7. Inspect CloudWatch logs by incident ID, the API 5XX alarm, and X-Ray traces.
   The alarm has no notification subscription configured.

Public traffic needs submission abuse controls and bounded/paginated incident
responses before scaling. The current city query is suitable for a small hackathon
pilot, not an unbounded municipal feed. Validate latency/cost under actual load.
