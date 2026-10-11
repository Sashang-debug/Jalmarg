export const WORK_LABELS={REPORTED:'New report',UNDER_REVIEW:'Checked',ASSIGNED:'Assigned',IN_PROGRESS:'Work ongoing',RESOLUTION_SUBMITTED:'Completion needs verification',RESOLVED:'Completed',REOPENED:'Still flooded',REJECTED:'Not actionable',DUPLICATE:'Linked to another report'}
export function workActions(item,userId) {
 const state=item.workStatus||'REPORTED',mine=item.workTicket?.assigneeSub===userId
 if(['REPORTED','REOPENED','UNDER_REVIEW'].includes(state))return ['TAKE_AND_START','ASSIGN','REJECT','DUPLICATE']
 if(state==='ASSIGNED')return mine?['TAKE_AND_START','ASSIGN']:['ASSIGN']
 if(state==='IN_PROGRESS')return mine?['SUBMIT_RESOLUTION']:[]
 if(state==='RESOLUTION_SUBMITTED')return mine?['REOPEN']:['APPROVE_RESOLUTION','REOPEN']
 if(['RESOLVED','REJECTED','DUPLICATE'].includes(state))return ['REOPEN']
 return []
}
export function priority(item) {return item.depthCm>=50?{rank:0,label:'High priority'}:item.depthCm>=30?{rank:1,label:'Needs attention'}:{rank:2,label:'Standard'}}
