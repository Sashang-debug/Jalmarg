import { lazy, Suspense } from 'react'

const LeafletMap = lazy(() => import('./LeafletMap'))
const GoogleMapEngine = lazy(() => import('./GoogleMapEngine'))

// Separate components keep each map provider's hook order stable when keys change.
export default function InteractiveMap(props) {
  return <Suspense fallback={<div className="map-loading" role="status">Loading the map…</div>}>
    {props.googleApiKey
      ? <GoogleMapEngine key={props.googleApiKey} {...props} apiKey={props.googleApiKey} potholes={[]} showPotholes={false} />
      : <LeafletMap {...props} />}
  </Suspense>
}
