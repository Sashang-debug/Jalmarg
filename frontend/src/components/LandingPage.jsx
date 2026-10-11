import { MapPinned, ArrowUpRight, Navigation, Droplets, Building2, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function LandingPage({ navigate, signedIn, municipal }) {
  return (
    <div className="portal landing-page">
      <header className="portal-header">
        <a className="portal-brand" href="#/">
          <MapPinned size={27} />
          <strong>JalMarg</strong>
        </a>
        <nav aria-label="Website navigation">
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            How it works
          </a>
          <button onClick={() => navigate(municipal ? 'municipal' : 'access')}>
            <span>Municipal access</span>
            <ArrowUpRight size={16} />
          </button>
          <button className="portal-login" onClick={() => navigate(signedIn ? 'account' : 'signin')}>
            {signedIn ? 'My account' : 'Sign in'}
          </button>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="landing-eyebrow-pill">
              <span className="eyebrow-dot" />
              <span>A clearer way through the monsoon</span>
            </div>
            <h1>
              Know the road.<br />Help clear the way.
            </h1>
            <p className="hero-lead">
              Waterlogging reports that guide your journey and help municipal teams act.
            </p>
            <div className="landing-actions">
              <button className="landing-primary-btn" onClick={() => navigate('map')}>
                <Navigation size={18} />
                <span>Explore the map</span>
              </button>
              <button className="landing-cta-link" onClick={() => navigate(signedIn ? 'account' : 'signup')}>
                <span>{signedIn ? 'Track my reports' : 'Create citizen account'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
            <aside className="hero-safety-notice" role="note" aria-label="Road safety advisory">
              <AlertTriangle size={16} className="safety-notice-icon" />
              <span>
                <strong>Safety advisory:</strong> Community observations are approximate and may be incomplete. Route guidance does not establish that a flooded road is safe to cross.
              </span>
            </aside>
          </div>
          <figure className="landing-preview">
            <img
              src="/journey-preview.jpg"
              alt="JalMarg map showing named journey endpoints and waterlogging-aware directions"
              fetchPriority="high"
            />
            <figcaption>A look inside JalMarg. Observations and journey times vary.</figcaption>
          </figure>
        </section>

        <section id="how-it-works" className="landing-process">
          <div>
            <h2>
              One report.<br />A connected response.
            </h2>
            <p>From a road observation to a visible work update, everyone has a part to play.</p>
          </div>
          <ol>
            <li>
              <div className="step-icon-wrap">
                <Droplets size={24} />
              </div>
              <div>
                <h3>See it. Report it.</h3>
                <p>Share a location, what you observed and an optional recent photo.</p>
              </div>
            </li>
            <li>
              <div className="step-icon-wrap">
                <Navigation size={24} />
              </div>
              <div>
                <h3>Choose your next turn.</h3>
                <p>Compare routes against recent reports and your selected vehicle.</p>
              </div>
            </li>
            <li>
              <div className="step-icon-wrap">
                <Building2 size={24} />
              </div>
              <div>
                <h3>Follow the response.</h3>
                <p>Verified municipal teams review, assign and update work. You can follow your report.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="landing-municipal">
          <ShieldCheck size={36} className="municipal-shield-icon" />
          <div>
            <h2>A workspace for the people clearing our roads.</h2>
            <p>Review local reports, coordinate assignments and document completed work with evidence.</p>
          </div>
          <button className="landing-municipal-cta" onClick={() => navigate(municipal ? 'municipal' : 'access')}>
            <span>{municipal ? 'Open workspace' : 'Request municipal access'}</span>
            <ArrowRight size={18} />
          </button>
        </section>

        <aside className="landing-note" role="note" aria-label="Road safety advisory">
          <div className="landing-note-badge">
            <AlertTriangle size={18} />
            <strong>Important Road Safety Advisory</strong>
          </div>
          <p>
            Community observations are approximate and may be incomplete. Route guidance does not establish that a flooded road is safe to cross.
          </p>
        </aside>
      </main>

      <footer className="portal-footer">
        <span>JalMarg · Built for the monsoon</span>
        <a href="#/map">
          <span>Open map</span>
          <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  )
}
