import {
  ArrowLeftRight,
  ClipboardList,
  History,
  ListChecks,
  House,
  QrCode,
  RotateCcw,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useDemoMission } from '../state/DemoMissionContext'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 42 42" fill="none">
        <path d="M21 3.5 25.7 15l12.1 6-12.1 5L21 38.5l-4.7-12.1-12.1-5 12.1-6L21 3.5Z" />
        <circle cx="21" cy="21" r="5.2" />
      </svg>
    </span>
  )
}

const parentLinks = [
  { to: '/parent', label: 'Accueil', Icon: House, end: true },
  { to: '/parent/mission', label: 'Mission', Icon: ClipboardList },
  { to: '/demo/templates', label: 'Modèles', Icon: ListChecks },
  { to: '/parent/new', label: 'Nouvelle mission', Icon: Sparkles },
]

const connectedLinks = [
  { to: '/parent/account', label: 'Mon compte', Icon: House },
  { to: '/parent/pairing', label: 'Appairage enfant', Icon: QrCode },
  { to: '/parent/history', label: 'Missions', Icon: History },
  { to: '/parent/create', label: 'Nouvelle mission', Icon: Sparkles },
  { to: '/parent/templates', label: 'Modèles', Icon: ListChecks },
]

export function AppLayout() {
  const location = useLocation()
  const { resetDemo } = useDemoMission()
  const isChild = location.pathname.startsWith('/demo/child')
  const isTemplateLibrary = location.pathname === '/parent/templates' || location.pathname === '/demo/templates'
  const isDemoTemplateLibrary = location.pathname === '/demo/templates'
  const isConnectedRoute = ['/parent/pairing', '/parent/history', '/parent/create', '/parent/templates'].includes(location.pathname)

  function handleReset() {
    if (window.confirm('Recommencer la mission de démonstration ? La mission et les réponses en cours seront effacées.')) {
      resetDemo()
    }
  }

  return (
    <div className={`app-shell ${isChild ? 'app-shell--child' : 'app-shell--parent'}`}>
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      <header className="topbar">
        <NavLink className="brand" to={isChild ? '/demo/child' : isConnectedRoute ? '/parent/account' : '/parent'} aria-label={`PackQuest, accueil ${isChild ? 'enfant' : 'parent'}`}>
          <BrandMark />
          <span className="brand-wordmark">PackQuest</span>
        </NavLink>

        <div className="topbar-context">
          <span className="demo-indicator"><span /> {isConnectedRoute ? 'Espace parent' : isTemplateLibrary ? 'Modèles de test' : 'Aperçu de démonstration'}</span>
        </div>

        <div className="topbar-actions">
          {!isConnectedRoute && <div className="role-switch" aria-label="Aperçu du rôle">
            <NavLink className={({ isActive }) => isActive ? 'role-switch__link is-active' : 'role-switch__link'} to="/parent">
              Parent
            </NavLink>
            <NavLink className={({ isActive }) => isActive ? 'role-switch__link is-active' : 'role-switch__link'} to="/demo/child">
              Enfant
            </NavLink>
          </div>}
          {!isTemplateLibrary && !isConnectedRoute && <button className="reset-button" type="button" onClick={handleReset} title="Recommencer la mission de démonstration" aria-label="Recommencer la mission de démonstration">
            <RotateCcw size={16} aria-hidden="true" />
            <span>Réinitialiser</span>
          </button>}
        </div>
      </header>

      {isConnectedRoute ? null : isTemplateLibrary ? (
        <div className="demo-banner" role="note">
          <span>{isDemoTemplateLibrary
            ? 'Mode test sans compte. Les modèles restent dans ce navigateur et ne sont pas synchronisés avec Supabase.'
            : 'Les modèles enregistrés sont rattachés au compte. Les missions et l’aperçu enfant restent en mode démo.'}</span>
        </div>
      ) : (
        <div className="demo-banner" role="note">
          <span className="demo-banner__spark"><Sparkles size={14} aria-hidden="true" /></span>
          <span><strong>Mode démo.</strong> Les missions restent en mémoire jusqu’au rechargement.</span>
          <span className="demo-banner__hint"><ArrowLeftRight size={14} aria-hidden="true" /> Change de vue pour suivre le même parcours</span>
        </div>
      )}

      <div className="app-frame">
        {!isChild && (
          <aside className="sidebar" aria-label="Navigation parent">
            <p className="sidebar-label">ESPACE PARENT</p>
            <nav className="sidebar-nav">
              {(isConnectedRoute ? connectedLinks : parentLinks).map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end className={({ isActive }) => isActive ? 'sidebar-link is-active' : 'sidebar-link'}>
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            {!isTemplateLibrary && !isConnectedRoute && <div className="sidebar-family-card">
              <div className="avatar avatar--small">N</div>
              <div>
                <span className="sidebar-family-card__eyebrow">PROFIL FICTIF</span>
                <strong>Noa</strong>
              </div>
              <UsersRound size={16} className="sidebar-family-card__icon" aria-hidden="true" />
            </div>}
            {!isTemplateLibrary && !isConnectedRoute && <div className="sidebar-footnote">Une première maquette pour explorer le parcours.</div>}
          </aside>
        )}

        <main id="main-content" className={`main-content ${isChild ? 'main-content--child' : ''}`}>
          <Outlet />
        </main>
      </div>

      {isChild && (
        <nav className="child-bottom-nav" aria-label="Navigation enfant — aperçu">
          <NavLink to="/demo/child" end className={({ isActive }) => isActive ? 'child-bottom-nav__link is-active' : 'child-bottom-nav__link'}>
            <House size={19} aria-hidden="true" />
            <span>Accueil</span>
          </NavLink>
          <NavLink to="/demo/child/mission" className={({ isActive }) => isActive ? 'child-bottom-nav__link is-active' : 'child-bottom-nav__link'}>
            <ClipboardList size={19} aria-hidden="true" />
            <span>Ma mission</span>
          </NavLink>
          <button className="child-bottom-nav__link" type="button" onClick={handleReset}>
            <RotateCcw size={19} aria-hidden="true" />
            <span>Réinitialiser</span>
          </button>
        </nav>
      )}
    </div>
  )
}
