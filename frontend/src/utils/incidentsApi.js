export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function apiRequest(path, { body, token, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: body ? 'POST' : 'GET', signal: signal || AbortSignal.timeout(15000),
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: token.startsWith('ey') ? token : `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const data = await response.json().catch(() => ({ error: 'The incident service returned an unreadable response.' }))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`)
  return data
}

export function browserReporterId() {
  let id = localStorage.getItem('jalmarg_reporter_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('jalmarg_reporter_id', id) }
  return id
}

export function evidenceUrl(value) {
  if (!value || !value.startsWith('/api/')) return value
  return `${API_BASE}${value.slice(4)}`
}

export function timeAgo(value, now = Date.now()) {
  const elapsed = Math.max(0, Math.floor((now - Date.parse(value)) / 60000))
  return elapsed < 1 ? 'Just now' : elapsed < 60 ? `${elapsed} min ago` : `${Math.floor(elapsed / 60)} hr ago`
}

export const STATUS_LABELS = { REPORTED: 'Reported', NEEDS_REVIEW: 'Needs review', CONFIRMED: 'Operator confirmed', CLEARED: 'Cleared' }
