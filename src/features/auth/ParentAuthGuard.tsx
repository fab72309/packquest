import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { supabase } from '../../lib/supabase/client'

export function ParentAuthGuard() {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setSignedIn(Boolean(session))
      setReady(true)
    })
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSignedIn(Boolean(data.session))
      setReady(true)
    }).catch(() => { if (active) setReady(true) })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  if (!supabase) return <section className="template-account-state"><h1>Compte parent indisponible</h1><p>La connexion n’est pas configurée sur cette version.</p></section>
  if (!ready) return <div className="template-account-state" role="status">Vérification du compte…</div>
  if (!signedIn) return <Navigate to="/parent/account" replace />
  return <Outlet />
}
