export function validateSessionClaims(claims, expected, now=Date.now()) {
  if (!claims || claims.nonce !== expected.nonce || claims.aud !== expected.clientId || claims.token_use !== 'id' ||
      ![true,'true'].includes(claims.email_verified) || !Number.isFinite(claims.exp) || claims.exp*1000 <= now || !claims.sub) throw new Error('A verified sign-in is required.')
  return claims
}
export function accountDestination(profile, requested='account') {
  if (profile?.role==='MUNICIPAL') return 'municipal'
  return ['account','map','access'].includes(requested) ? requested : 'account'
}
