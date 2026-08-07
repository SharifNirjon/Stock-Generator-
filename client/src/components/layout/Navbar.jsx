import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/collections', label: 'Collections' },
  { to: '/reports/new', label: 'Reports' },
  { to: '/reports/templates', label: 'Saved Reports' },
  { to: '/reports/stock', label: 'Stock Report' },
];

export default function Navbar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="row">
          <button className="hamburger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            ☰
          </button>
          <div className="brand">📊 DataDesk</div>
        </div>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={l.to === '/'}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
