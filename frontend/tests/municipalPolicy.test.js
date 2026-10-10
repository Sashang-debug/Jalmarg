import test from 'node:test'
import assert from 'node:assert/strict'
import {workActions,priority} from '../src/utils/municipalPolicy.js'
test('worker actions follow state and assigned identity; own completion cannot be approved',()=>{
 assert.deepEqual(workActions({workStatus:'REPORTED'},'me'),['REVIEW','REJECT','DUPLICATE'])
 assert.deepEqual(workActions({workStatus:'ASSIGNED',workTicket:{assigneeSub:'other'}},'me'),['ASSIGN'])
 assert.deepEqual(workActions({workStatus:'IN_PROGRESS',workTicket:{assigneeSub:'other'}},'me'),[])
 assert.deepEqual(workActions({workStatus:'IN_PROGRESS',workTicket:{assigneeSub:'me'}},'me'),['SUBMIT_RESOLUTION'])
 assert.deepEqual(workActions({workStatus:'RESOLUTION_SUBMITTED',workTicket:{assigneeSub:'me'}},'me'),['REOPEN'])
 assert.ok(workActions({workStatus:'RESOLUTION_SUBMITTED',workTicket:{assigneeSub:'other'}},'me').includes('APPROVE_RESOLUTION'))
 assert.deepEqual(workActions({workStatus:'RESOLVED'},'me'),['REOPEN'])
})
test('queue priority is explicit reported depth, not a fabricated AI score',()=>{
 assert.equal(priority({depthCm:50}).rank,0);assert.equal(priority({depthCm:30}).rank,1);assert.equal(priority({depthCm:15}).rank,2)
})
