import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export default function Dialog({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className={`jm-dialog ${wide ? 'wide' : ''}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="dialog-body">
      <header className="dialog-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></header>
      {children}
    </div>
  </dialog>
}
