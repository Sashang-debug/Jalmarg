import test from 'node:test'
import assert from 'node:assert/strict'
import {validateSessionClaims,accountDestination} from '../src/utils/accountPolicy.js'
test('sign-in binds nonce, client, token kind, verified email, identity and expiry',()=>{
 const now=Date.now(),claims={sub:'one',nonce:'nonce',aud:'client',token_use:'id',email_verified:true,exp:Math.ceil(now/1000)+60},expected={nonce:'nonce',clientId:'client'}
 assert.equal(validateSessionClaims(claims,expected,now).sub,'one')
 for(const bad of [{nonce:'other'},{aud:'other'},{token_use:'access'},{email_verified:'false'},{exp:1},{sub:''}]) assert.throws(()=>validateSessionClaims({...claims,...bad},expected,now))
})
test('navigation follows approved backend role and cannot redirect outside the app',()=>{
 assert.equal(accountDestination({role:'MUNICIPAL'}),'municipal')
 assert.equal(accountDestination({role:'CITIZEN'},'access'),'access')
 assert.equal(accountDestination({role:'CITIZEN'},'https://evil.example'),'account')
})
