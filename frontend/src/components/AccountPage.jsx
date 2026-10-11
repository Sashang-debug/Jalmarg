import { useState } from 'react'
import {
  MapPinned,
  ArrowLeft,
  ShieldCheck,
  Building2,
  LogOut,
  Navigation,
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react'
import { beginLogin, accountsConfigured } from '../utils/accountAuth'
import { apiRequest } from '../utils/incidentsApi'
import { CITIES } from '../utils/cities'

export default function AccountPage({ screen, session, profile, busy, error: outerError, onProfile, navigate, logout, children }) {
  const [error, setError] = useState(''), [saving, setSaving] = useState(false), [reapplying, setReapplying] = useState(false)
  const access = screen === 'access', signup = screen === 'signup'

  async function login() {
    setError('')
    try {
      await beginLogin({ signup, returnTo: access ? 'access' : 'account' })
    } catch (e) {
      setError(e.message)
    }
  }

  async function rename(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest('/me', {
        token: session.token,
        body: { name: new FormData(event.currentTarget).get('name') }
      })
      onProfile(result.profile)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function apply(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const result = await apiRequest('/municipal/apply', { token: session.token, body: fields })
      onProfile(result.profile)
      setReapplying(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="portal account-page">
      <header className="portal-header">
        <a className="portal-brand" href="#/">
          <MapPinned size={27} />
          <strong>JalMarg</strong>
        </a>
        <button className="landing-text-link" onClick={() => navigate('map')}>
          <Navigation size={17} />
          Explore map
        </button>
      </header>

      <main className="account-layout">
        <div className="account-intro">
          <button className="account-back-btn" onClick={() => navigate('')}>
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </button>

          <div className="account-pill-label">
            <span className="account-pill-dot" />
            <span>{access ? 'Civic Operations' : signup ? 'Citizen Network' : 'Urban Telemetry Platform'}</span>
          </div>

          <h1 className="account-title">
            {access
              ? 'Work towards clearer roads.'
              : session
              ? 'Your part in a clearer city.'
              : signup
              ? 'Your city needs your view.'
              : 'Welcome back.'}
          </h1>

          <p className="account-subtitle">
            {access
              ? 'A verified workspace for municipal teams to review reports, deploy pump crews, and coordinate emergency responses.'
              : session
              ? 'Manage your public citizen profile, review your submitted road reports, or request municipal team access.'
              : signup
              ? 'Join citizen reporters to document real-time waterlogging depths, warn fellow commuters, and accelerate civic clearance.'
              : 'Report waterlogging, follow the response and plan your next journey.'}
          </p>

          {!session && (
            <ul className="account-perks-list">
              <li>
                <CheckCircle2 size={16} className="perk-icon" />
                <span>Verified road inundation and obstacle alerts</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-icon" />
                <span>Vehicle-aware rerouting based on water depth</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-icon" />
                <span>Direct pipeline to municipal drainage authorities</span>
              </li>
            </ul>
          )}

          <div className="account-trust-banner">
            <ShieldCheck size={22} className="trust-icon" />
            <div className="trust-content">
              <strong>Enterprise-grade security</strong>
              <p>
                {access
                  ? 'Municipal permissions require verification and approval.'
                  : 'Your password and email verification are handled by Amazon Cognito.'}
              </p>
            </div>
          </div>
        </div>

        <section className="account-card" aria-label="Account access">
          {busy ? (
            <div className="account-card-busy">
              <p role="status">Checking your account…</p>
            </div>
          ) : !session ? (
            <div className="account-card-content">
              <div className="account-card-top">
                <span className="account-card-eyebrow">
                  {access ? 'Civic Administration' : signup ? 'Citizen Registration' : 'Authorized Sign In'}
                </span>
                <h2>
                  {access
                    ? 'Municipal access'
                    : signup
                    ? 'Create your citizen account'
                    : 'Sign in to JalMarg'}
                </h2>
                <p className="account-card-lead">
                  {access
                    ? 'Sign in with a verified email, then request access for your corporation and service area.'
                    : signup
                    ? 'Continue to secure signup or sign-in. Email verification and password recovery are available there.'
                    : 'Continue to secure signup or sign-in. Email verification and password recovery are available there.'}
                </p>
              </div>

              <button className="account-primary-cta" onClick={login}>
                <Lock size={16} />
                <span>{signup ? 'Continue to signup' : access ? 'Continue to municipal access' : 'Continue to sign in'}</span>
                <ArrowRight size={16} />
              </button>

              {!accountsConfigured && (
                <div className="account-warning-box">
                  <p className="info-box">Account service has not been configured for this deployment. Public map browsing is available.</p>
                </div>
              )}

              <div className="account-card-divider">
                <span>or</span>
              </div>

              <div className="account-card-footer">
                <button
                  className="account-toggle-btn"
                  onClick={() => navigate(signup ? 'signin' : 'signup')}
                >
                  {signup ? (
                    <>Already have an account? <strong>Sign in</strong></>
                  ) : (
                    <>New here? <strong>Create a citizen account</strong></>
                  )}
                </button>

                {access ? (
                  <button className="account-sub-link" onClick={() => navigate('signin')}>
                    Citizen sign in
                  </button>
                ) : (
                  <button className="account-sub-link" onClick={() => navigate('access')}>
                    Municipal worker? Request civic access
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="account-heading">
                <div>
                  <h2>{profile?.name || 'Your account'}</h2>
                  <p>{profile?.email}</p>
                </div>
                <button className="icon-button" aria-label="Sign out" onClick={logout}>
                  <LogOut size={20} />
                </button>
              </div>
              <span className="membership-badge">
                {profile?.role === 'MUNICIPAL' ? 'Verified municipal worker' : 'Citizen account'}
              </span>

              {access ? (
                profile?.membership && !reapplying ? (
                  <div className="membership-details">
                    <Building2 size={26} />
                    <h3>{profile.membership.corporation}</h3>
                    <p>{CITIES[profile.membership.city]?.name} · {profile.membership.ward}</p>
                    <strong>{profile.membership.status === 'PENDING' ? 'Awaiting administrator approval' : profile.membership.status}</strong>
                    {profile.membership.reason && <p>{profile.membership.reason}</p>}
                    {profile.membership.status === 'REJECTED' && (
                      <button className="secondary-button" onClick={() => setReapplying(true)}>
                        Submit a corrected request
                      </button>
                    )}
                    {profile.role === 'MUNICIPAL' ? (
                      <button className="primary-button" onClick={() => navigate('municipal')}>
                        Open municipal workspace
                      </button>
                    ) : (
                      <p>Approval is managed by your JalMarg administrator. Approved accounts may need to sign in again to refresh permissions.</p>
                    )}
                  </div>
                ) : (
                  <form className="form-stack" onSubmit={apply}>
                    <h3>Request municipal access</h3>
                    <label>
                      Municipal corporation
                      <input name="corporation" required maxLength={120} autoComplete="organization" />
                    </label>
                    <label>
                      City
                      <select name="city" defaultValue="GWL">
                        {Object.entries(CITIES).filter(([id]) => id !== 'OTHER').map(([id, city]) => (
                          <option key={id} value={id}>{city.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ward or service area
                      <input name="ward" required maxLength={100} />
                    </label>
                    <label>
                      Employee identifier
                      <input name="employeeId" required maxLength={80} />
                    </label>
                    <p className="help-text">This request does not grant municipal permissions. An administrator verifies your details.</p>
                    <button className="primary-button" disabled={saving}>
                      {saving ? 'Submitting…' : 'Submit access request'}
                    </button>
                  </form>
                )
              ) : (
                <>
                  <form className="form-stack" onSubmit={rename}>
                    <label>
                      Display name
                      <input name="name" required maxLength={100} defaultValue={profile?.name} />
                    </label>
                    <p className="help-text">This name is visible on municipal assignments and work updates.</p>
                    <button className="secondary-button" disabled={saving}>
                      {saving ? 'Saving…' : 'Save display name'}
                    </button>
                  </form>
                  <button className="secondary-button" onClick={() => navigate('map')}>
                    Open journey map
                  </button>
                  {profile?.role === 'MUNICIPAL' ? (
                    <button className="landing-text-link" onClick={() => navigate('municipal')}>
                      Open municipal workspace
                    </button>
                  ) : (
                    <button className="landing-text-link" onClick={() => navigate('access')}>
                      Request municipal access
                    </button>
                  )}
                  {children}
                </>
              )}
            </>
          )}
          {(error || outerError) && <p className="error-message" role="alert">{error || outerError}</p>}
        </section>
      </main>
    </div>
  )
}
