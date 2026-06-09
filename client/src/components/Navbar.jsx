import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleColor = {
    ADMIN: '#dc2626',
    PHOTOGRAPHER: '#7c3aed',
    MEMBER: '#0284c7',
    VIEWER: '#6b7280',
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>🎯 EventMedia</Link>

        <div style={styles.links}>
          <Link to="/events" style={styles.link}>Events</Link>
          <Link to="/search" style={styles.link}>Search</Link>
          {user && (user.role === 'ADMIN' || user.role === 'PHOTOGRAPHER') && (
            <Link to="/events/create" style={styles.link}>+ Create Event</Link>
          )}
          {user && user.role === 'ADMIN' && (
            <Link to="/admin" style={{ ...styles.link, color: '#dc2626' }}>Admin</Link>
          )}
        </div>

        <div style={styles.right}>
          {user ? (
            <>
              <NotificationBell />
              <span style={{...styles.roleBadge, background: roleColor[user.role] + '18', color: roleColor[user.role]}}>
                {user.role}
              </span>
              <Link to={`/profile/${user.id}`} style={{ ...styles.link, fontWeight: '600' }}>
                {user.name}
              </Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  logo: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#4f46e5',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  link: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  roleBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    padding: '0.4rem 1rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.85rem',
    color: '#374151',
    cursor: 'pointer',
  },
  registerBtn: {
    padding: '0.4rem 1rem',
    background: '#4f46e5',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '500',
    textDecoration: 'none',
  },
}