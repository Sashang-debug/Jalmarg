import { useEffect, useState } from 'react'
import { Droplets, RefreshCw } from 'lucide-react'
import { apiRequest } from '../utils/incidentsApi'
import ReportEvidence from './ReportEvidence'
import { WORK_LABELS } from '../utils/municipalPolicy.js'
export default function MyReports({ session, navigate }) {
 const [items,setItems]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState(null),[reload,setReload]=useState(0)
 useEffect(()=>{const controller=new AbortController();setBusy(true);apiRequest('/my-reports',{token:session.token,signal:controller.signal}).then(data=>setItems(data.incidents)).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});return()=>controller.abort()},[session.token,reload])
 function changed(item){setItems(previous=>previous.map(i=>i.id===item.id?item:i));setSelected(item)}
 return <section className="my-reports"><header><h3>My reports</h3><button className="icon-button" aria-label="Refresh my reports" onClick={()=>{setError('');setReload(v=>v+1)}}><RefreshCw size={17}/></button></header>{busy?<p role="status">Loading your reports…</p>:items.length?<div>{items.map(item=><button className="my-report" key={item.id} onClick={()=>setSelected(item)}><Droplets size={19}/><span><strong>{item.roadName}</strong><small>{WORK_LABELS[item.workStatus]||'Reported'} · {new Date(item.createdAt).toLocaleDateString()}</small></span></button>)}</div>:<><p>Your reports will appear here with municipal progress and resolution updates.</p><button className="landing-text-link" onClick={()=>navigate('map')}>Report on the map</button></>}{error&&<p role="alert" className="error-message">{error}</p>}{selected&&<ReportEvidence incident={selected} session={session} onClose={()=>setSelected(null)} onChanged={changed} vehicle="BIKE"/>}</section>
}
