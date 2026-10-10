import { validateSessionClaims } from './accountPolicy.js'
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID
const domain = import.meta.env.VITE_COGNITO_DOMAIN?.replace(/\/$/, '')
export const accountsConfigured = Boolean(clientId && domain)
const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const random = () => encode(crypto.getRandomValues(new Uint8Array(32)))
export async function beginLogin({ signup = false, returnTo = 'account' } = {}) {
  if (!accountsConfigured) throw new Error('Account service is not configured. You can still explore the public map.')
  const saved = { verifier: random(), state: random(), nonce: random(), at: Date.now(), returnTo }
  const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(saved.verifier))))
  sessionStorage.setItem('jalmarg_account_oauth',JSON.stringify(saved))
  const params = new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:`${location.origin}/`,scope:'openid email profile aws.cognito.signin.user.admin',code_challenge:challenge,code_challenge_method:'S256',state:saved.state,nonce:saved.nonce})
  location.assign(`${domain}/${signup ? 'signup' : 'oauth2/authorize'}?${params}`)
}
let callbackPromise
export function completeLogin() { return callbackPromise ||= finishLogin() }
async function finishLogin() {
  const params = new URLSearchParams(location.search)
  if (!params.has('code') && !params.has('error')) return null
  let saved
  try { saved=JSON.parse(sessionStorage.getItem('jalmarg_account_oauth') || 'null') } catch { /* invalid saved flow is rejected below */ }
  sessionStorage.removeItem('jalmarg_account_oauth')
  history.replaceState({},'',location.pathname)
  if (!saved || params.get('state') !== saved.state || Date.now()-saved.at>600000) throw new Error('Sign-in session expired. Please try again.')
  if (params.has('error')) throw new Error('Sign-in was cancelled or denied.')
  const response=await fetch(`${domain}/oauth2/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code:params.get('code'),client_id:clientId,redirect_uri:`${location.origin}/`,code_verifier:saved.verifier}),signal:AbortSignal.timeout(15000)})
  const data=await response.json()
  if (!response.ok || !data.id_token) throw new Error('Could not finish sign-in. Please try again.')
  const part=data.id_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')
  const claims=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part),c=>c.charCodeAt(0))))
  validateSessionClaims(claims,{nonce:saved.nonce,clientId})
  // Signature verification is performed independently by the API authorizer.
  // Tokens remain in memory; reload uses Cognito's existing sign-in session.
  return {token:data.id_token,accessToken:data.access_token,expiresAt:claims.exp*1000,returnTo:saved.returnTo}
}
export async function endLogin(accessToken) {
  if (accessToken) {
    const region=import.meta.env.VITE_AWS_REGION || 'ap-south-1'
    await fetch(`https://cognito-idp.${region}.amazonaws.com/`,{method:'POST',headers:{'Content-Type':'application/x-amz-json-1.1','X-Amz-Target':'AWSCognitoIdentityProviderService.GlobalSignOut'},body:JSON.stringify({AccessToken:accessToken}),signal:AbortSignal.timeout(10000)}).catch(()=>{})
  }
  if (accountsConfigured) location.assign(`${domain}/logout?${new URLSearchParams({client_id:clientId,logout_uri:`${location.origin}/`})}`)
}
