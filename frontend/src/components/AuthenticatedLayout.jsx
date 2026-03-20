import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthenticatedLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-topbar">
        <Link to="/" className="app-topbar__brand">
          AI Knowledge Quiz
        </Link>
        <nav className="app-topbar__nav" aria-label="Main">
          <Link to="/history" className="app-topbar__nav-link">
            History
          </Link>
        </nav>
        <div className="app-topbar__user">
          <span className="app-topbar__email" title={user?.email}>
            {user?.email}
          </span>
          <button type="button" className="btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </>
  );
}
