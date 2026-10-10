export const WORK_LABELS={REPORTED:'Reported',UNDER_REVIEW:'Under review',ASSIGNED:'Assigned',IN_PROGRESS:'Work in progress',RESOLUTION_SUBMITTED:'Resolution awaiting review',RESOLVED:'Resolved',REOPENED:'Reopened',REJECTED:'Rejected',DUPLICATE:'Linked to another report'}
export function workActions(item,userId) {
 const state=item.workStatus||'REPORTED',mine=item.workTicket?.assigneeSub===userId
 if(['REPORTED','REOPENED'].includes(state))return ['REVIEW','REJECT','DUPLICATE']
 if(state==='UNDER_REVIEW')return ['ASSIGN','REJECT','DUPLICATE']
 if(state==='ASSIGNED')return mine?['START','ASSIGN']:['ASSIGN']
 if(state==='IN_PROGRESS')return mine?['SUBMIT_RESOLUTION']:[]
 if(state==='RESOLUTION_SUBMITTED')return mine?['REOPEN']:['APPROVE_RESOLUTION','REOPEN']
 if(['RESOLVED','REJECTED','DUPLICATE'].includes(state))return ['REOPEN']
 return []
}
export function priority(item) {return item.depthCm>=50?{rank:0,label:'High priority'}:item.depthCm>=30?{rank:1,label:'Needs attention'}:{rank:2,label:'Standard'}}
