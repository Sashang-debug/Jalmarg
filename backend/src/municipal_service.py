"""Municipal work lifecycle, independent of observation freshness."""
import time
from datetime import datetime
from incident_service import ApiError, iso, text, reporter_hash
from account_service import require_municipal

WORK_LABELS = {'REPORTED':'Reported','UNDER_REVIEW':'Under review','ASSIGNED':'Assigned','IN_PROGRESS':'Work in progress',
               'RESOLUTION_SUBMITTED':'Resolution awaiting review','RESOLVED':'Resolved','REOPENED':'Reopened',
               'REJECTED':'Rejected','DUPLICATE':'Linked to another incident'}


def mutate_work(item, body, identity, repository, now=None):
    now = time.time() if now is None else now
    require_municipal(identity, item['city'])
    if body.get('version') != item['version']:
        raise ApiError(409, 'This incident changed. Refresh before updating it.')
    state = item.get('workStatus', 'REPORTED')
    action = body.get('action')
    note = text(body.get('note'), 'Work note', 300)
    ticket = dict(item.get('workTicket') or {})
    updated = dict(item)
    if action == 'REVIEW' and state in {'REPORTED','REOPENED'}:
        state = 'UNDER_REVIEW'
    elif action == 'ASSIGN' and state in {'UNDER_REVIEW','ASSIGNED'}:
        worker = repository.get_profile(body.get('assigneeSub'))
        member = (worker or {}).get('membership') or {}
        if member.get('status') != 'APPROVED' or member.get('city') != item['city']:
            raise ApiError(400, 'Choose an approved municipal worker for this city.')
        ticket.update(id=ticket.get('id', f"JM-{item['id'][:8].upper()}"),assigneeSub=worker['id'],
                      assigneeName=worker['name'],assignedAt=iso(now))
        state = 'ASSIGNED'
    elif action == 'START' and state == 'ASSIGNED':
        if ticket.get('assigneeSub') != identity['id']:
            raise ApiError(403, 'Only the assigned worker can start this task.')
        state = 'IN_PROGRESS'
        ticket['startedAt'] = iso(now)
    elif action in {'REJECT','DUPLICATE'} and state in {'REPORTED','UNDER_REVIEW','REOPENED'}:
        if action == 'DUPLICATE':
            target_id = body.get('duplicateOf')
            if target_id == item['id']:
                raise ApiError(400, 'An incident cannot be its own duplicate.')
            target = repository.get(item['city'], target_id)
            if target.get('workStatus') in {'DUPLICATE','REJECTED','RESOLVED'}:
                raise ApiError(409, 'Link to an open original incident.')
            updated['duplicateOf'] = target['id']
        state = 'REJECTED' if action == 'REJECT' else 'DUPLICATE'
        # Marking work invalid/duplicate does not silently clear a road observation.
    elif action == 'SUBMIT_RESOLUTION' and state == 'IN_PROGRESS':
        if ticket.get('assigneeSub') != identity['id']:
            raise ApiError(403, 'Only the assigned worker can submit completion evidence.')
        key = body.get('evidenceKey')
        if not isinstance(key,str) or not repository.evidence_owned(key,identity['id']) or not repository.evidence_exists(key):
            raise ApiError(400, 'Upload an after-photo from your account before submitting resolution.')
        uploaded = repository.evidence_upload_time(key)
        if not uploaded or uploaded < ticket.get('startedAt', iso(now)):
            raise ApiError(400, 'Upload a new after-photo after starting this task.')
        if item.get('resolution'):
            updated['resolutionHistory'] = [*item.get('resolutionHistory', []), item['resolution']]
        updated['resolution'] = {'evidenceKey':key,'note':note,'submittedBy':identity['id'],
                                 'submittedByName':identity['name'],'submittedAt':iso(now)}
        state = 'RESOLUTION_SUBMITTED'
    elif action == 'APPROVE_RESOLUTION' and state == 'RESOLUTION_SUBMITTED':
        resolution = dict(item['resolution'])
        if now-datetime.fromisoformat(resolution['submittedAt']).timestamp()>4*3600:
            raise ApiError(409,'Completion evidence is too old to clear current road conditions. Reopen and obtain a fresh observation.')
        if resolution['submittedBy'] == identity['id']:
            raise ApiError(403, 'A different approved worker must review completion evidence.')
        resolution.update(reviewedBy=identity['id'],reviewedByName=identity['name'],reviewedAt=iso(now),reviewNote=note)
        updated.update(resolution=resolution,status='CLEARED',expiresAt=iso(now+4*3600))
        state = 'RESOLVED'
    elif action == 'REOPEN' and state in {'RESOLVED','RESOLUTION_SUBMITTED','REJECTED','DUPLICATE'}:
        state = 'REOPENED'
        updated.update(status='NEEDS_REVIEW',expiresAt=iso(now+4*3600))
        updated.pop('duplicateOf',None)
    else:
        raise ApiError(409, 'That action is unavailable for the current work status.')
    ticket['status'] = state
    updated.update(workStatus=state,workTicket=ticket,updatedAt=iso(now),version=item['version']+1)
    updated.pop('TTL',None)  # Legacy items gain durable work history on first action.
    updated['timeline']=[*item['timeline'],{'at':iso(now),'kind':action,'status':updated['status'],
                         'workStatus':state,'actor':identity['name'],'message':WORK_LABELS[state],'note':note}]
    return updated


def citizen_feedback(item, body, identity, now=None):
    now = time.time() if now is None else now
    action=body.get('action')
    if action not in {'STILL_FLOODED','RECEDED'}:
        raise ApiError(400,'Choose still flooded or water receded.')
    observations=list(item.get('observations',[]))
    owner=reporter_hash(identity['id'])
    if owner == item.get('reporterHash') and item.get('workStatus') not in {'RESOLVED','RESOLUTION_SUBMITTED','REOPENED'}:
        raise ApiError(409,'Your report is already recorded. Add a fresh report if conditions change.')
    previous=[o for o in observations if o['reporterHash']==owner]
    if previous and previous[-1]['kind']==action:
        raise ApiError(409,'You have already shared this observation. Submit a fresh report if conditions change.')
    if len(observations)>=100:
        raise ApiError(409,'Submit a fresh report for this location.')
    observations.append({'kind':action,'reporterHash':owner,'at':iso(now)})
    updated={**item,'observations':observations,'version':item['version']+1,'updatedAt':iso(now)}
    if action=='STILL_FLOODED':
        updated.update(status='NEEDS_REVIEW',expiresAt=iso(now+4*3600))
        if item.get('workStatus') in {'RESOLVED','RESOLUTION_SUBMITTED','REJECTED','DUPLICATE'}:
            updated['workStatus']='REOPENED'
            updated.pop('duplicateOf',None)
            updated['workTicket']={**(item.get('workTicket') or {}),'status':'REOPENED'}
    else:
        # Citizen recession never independently clears a road or completes work.
        updated['clearanceReviewRequestedAt']=iso(now)
    updated.pop('TTL',None)
    updated['timeline']=[*item['timeline'],{'at':iso(now),'kind':action,'status':updated['status'],
                         'workStatus':updated.get('workStatus','REPORTED'),
                         'message':'Citizen reports water still present; review requested.' if action=='STILL_FLOODED' else 'Citizen reports receding water; review requested.'}]
    return updated
