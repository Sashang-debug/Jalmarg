const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID
const domain = import.meta.env.VITE_COGNITO_DOMAIN?.replace(/\/$/, '')
export const cloudAuthConfigured = Boolean(clientId && domain)
const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const random = () => encode(crypto.getRandomValues(new Uint8Array(32)))

export async function beginOperatorLogin() {
  if (!cloudAuthConfigured) throw new Error('Operator sign-in has not been configured for this deployment.')
  const verifier = random(), state = random(), nonce = random()
  const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  sessionStorage.setItem('jalmarg_oauth', JSON.stringify({ verifier, state, nonce, at: Date.now() }))
  const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: `${location.origin}/`,
    scope: 'openid', code_challenge: challenge, code_challenge_method: 'S256', state, nonce })
  location.assign(`${domain}/oauth2/authorize?${params}`)
}

let callbackPromise
export function completeOperatorLogin() {
  if (callbackPromise) return callbackPromise
  callbackPromise = finishLogin()
  return callbackPromise
}

async function finishLogin() {
  const params = new URLSearchParams(location.search)
  if (!params.has('code') && !params.has('error')) return null
  const saved = JSON.parse(sessionStorage.getItem('jalmarg_oauth') || 'null')
  sessionStorage.removeItem('jalmarg_oauth')
  history.replaceState({}, '', location.pathname)
  if (!saved || params.get('state') !== saved.state || Date.now() - saved.at > 10 * 60000) throw new Error('Sign-in session expired. Please sign in again.')
  if (params.has('error')) throw new Error('Operator sign-in was cancelled or denied.')
  const response = await fetch(`${domain}/oauth2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: params.get('code'), client_id: clientId,
      redirect_uri: `${location.origin}/`, code_verifier: saved.verifier }), signal: AbortSignal.timeout(15000) })
  const data = await response.json()
  if (!response.ok || !data.id_token) throw new Error('Could not complete operator sign-in.')
  // Client-side nonce check binds this callback to the initiated flow. The API
  // Gateway authorizer independently verifies the JWT signature, expiry and pool.
  const encoded = data.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const claims = JSON.parse(atob(encoded))
  if (claims.nonce !== saved.nonce || claims.aud !== clientId || !claims['cognito:groups']?.includes('civic-operators')) throw new Error('This account is not a civic operator.')
  return { token: data.id_token, expiresAt: claims.exp * 1000 }
}
