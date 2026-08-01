import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  BrandMark,
  IconClock,
  IconLogout,
  IconMenu,
  IconPanelLeft,
  IconPlus,
} from './icons.jsx';

const COLLAPSE_KEY = 'ui_sidebar_collapsed';

const navCls = ({ isActive }) =>
  'sidebar__link' + (isActive ? ' is-active' : '');

function pageTitle(pathname) {
  if (pathname === '/') return 'New quiz';
  if (pathname.startsWith('/history')) return 'History';
  if (pathname.startsWith('/quiz/')) return 'Take quiz';
  if (pathname.startsWith('/result/')) return 'Results';
  return 'Workspace';
}

export default function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1'
  );

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // One toggle, two behaviors: closes the drawer on mobile, collapses the
  // sidebar to an icon rail on desktop (preference persisted).
  const handleSidebarToggle = () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setNavOpen(false);
    } else {
      setCollapsed((c) => {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
        return !c;
      });
    }
  };

  const initial = (user?.name || user?.email || '?').trim().charAt(0);
  const title = pageTitle(location.pathname);

  const sidebarCls =
    'sidebar' +
    (navOpen ? ' sidebar--open' : '') +
    (collapsed ? ' sidebar--collapsed' : '');

  return (
    <div className="shell">
      <aside className={sidebarCls}>
        <div className="sidebar__head">
          <Link to="/" className="sidebar__brand" title="Quiz Builder">
            <BrandMark />
            <span className="sidebar__brand-name">Quiz Builder</span>
            <span className="brand-badge">AI</span>
          </Link>
          <button
            type="button"
            className="icon-btn sidebar__toggle"
            onClick={handleSidebarToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconPanelLeft />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          <span className="sidebar__section">Workspace</span>
          <NavLink to="/" end className={navCls} title="New quiz">
            <IconPlus />
            <span className="sidebar__link-text">New quiz</span>
          </NavLink>
          <NavLink to="/history" className={navCls} title="History">
            <IconClock />
            <span className="sidebar__link-text">History</span>
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <div className="user-card">
            <span className="avatar" aria-hidden="true" title={user?.email}>
              {initial}
            </span>
            <div className="user-card__meta">
              <span className="user-card__name" title={user?.name}>
                {user?.name}
              </span>
              <span className="user-card__email" title={user?.email}>
                {user?.email}
              </span>
            </div>
            <button
              type="button"
              className="icon-btn user-card__logout"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      {navOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="shell__main">
        <header className="appbar">
          <button
            type="button"
            className="icon-btn appbar__menu"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <nav className="appbar__crumbs" aria-label="Breadcrumb">
            <span className="appbar__crumb-root">Workspace</span>
            <span className="appbar__crumb-sep" aria-hidden="true">
              /
            </span>
            <span className="appbar__crumb" aria-current="page">
              {title}
            </span>
          </nav>
          <div className="appbar__actions">
            {location.pathname !== '/' && (
              <Link to="/" className="btn primary small">
                <IconPlus />
                New quiz
              </Link>
            )}
          </div>
        </header>
        <main className="content">
          <div className="content__inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
