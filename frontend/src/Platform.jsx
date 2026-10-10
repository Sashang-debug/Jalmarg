import { useEffect, useState } from 'react'
import App from './App'
import LandingPage from './components/LandingPage'
import AccountPage from './components/AccountPage'
import MyReports from './components/MyReports'
import MunicipalWorkspace from './components/MunicipalWorkspace'
import { completeLogin, endLogin } from './utils/accountAuth'
import { apiRequest } from './utils/incidentsApi'
import { accountDestination } from './utils/accountPolicy.js'
import './portal.css'
const screenFromHash=()=>location.hash.startsWith('#/')?location.hash.slice(2).split('?')[0]:''
export default function Platform() {
  const [screen,setScreen]=useState(screenFromHash),[session,setSession]=useState(null),[profile,setProfile]=useState(null),[busy,setBusy]=useState(Boolean(location.search)),[error,setError]=useState('')
  useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const choice=localStorage.getItem('jalmarg_theme')||'system';document.documentElement.dataset.theme=choice==='system'?(media.matches?'dark':'light'):choice};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[])
  useEffect(()=>{const change=()=>{setScreen(screenFromHash());window.scrollTo(0,0)};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[])
  function navigate(value){location.hash=`/${value}`}
  useEffect(()=>{let active=true;completeLogin().then(async result=>{if(!result)return;const data=await apiRequest('/me',{token:result.token});if(active){setSession(result);setProfile(data.profile);navigate(accountDestination(data.profile,result.returnTo))}}).catch(e=>{if(active){setError(e.message);navigate('signin')}}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[])
  useEffect(()=>{if(!session)return;const timer=setTimeout(()=>{setSession(null);setProfile(null);setError('Your session expired. Sign in again to continue.');navigate('signin')},Math.max(0,session.expiresAt-Date.now()));return()=>clearTimeout(timer)},[session])
  function logout(){const access=session?.accessToken;setSession(null);setProfile(null);navigate('');endLogin(access)}
  return screen==='municipal'&&session&&profile?.role==='MUNICIPAL'?<MunicipalWorkspace session={session} profile={profile} navigate={navigate} logout={logout}/>:screen==='map'?<App session={session} profile={profile} navigate={navigate}/>:screen?<AccountPage screen={screen} session={session} profile={profile} busy={busy} error={error} onProfile={setProfile} navigate={navigate} logout={logout}>{session&&profile&&<MyReports session={session} navigate={navigate}/>}</AccountPage>:<LandingPage navigate={navigate} signedIn={Boolean(session)} municipal={profile?.role==='MUNICIPAL'}/>
}
