import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const ROLES = ['VIEWER', 'MEMBER', 'PHOTOGRAPHER', 'ADMIN']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [recentMedia, setRecentMedia] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/users/admin/stats'),
        api.get('/users'),
      ])
      setStats(statsRes.data.stats)
      setRecentMedia(statsRes.data.recentMedia)
      setUsers(usersRes.data.users)
    } catch (err) {
      alert('Failed to load admin data. Make sure you are logged in as ADMIN.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      alert('Failed to update role.')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    try {
      await api.delete(`/users/${userId}`)
      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.')
    }
  }

  const roleColor = {
    ADMIN: '#dc2626', PHOTOGRAPHER: '#7c3aed',
    MEMBER: '#0284c7', VIEWER: '#6b7280',
  }

  if (loading) return <div style={styles.center}>Loading dashboard...</div>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>⚙️ Admin Dashboard</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              background: activeTab === tab ? '#4f46e5' : '#f3f4f6',
              color: activeTab === tab ? '#fff' : '#374151',
            }}
          >
            {tab === 'overview' ? '📊 Overview' : '👥 Users'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Stat cards */}
          <div style={styles.statGrid}>
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👤', color: '#4f46e5' },
              { label: 'Total Events', value: stats.totalEvents, icon: '📅', color: '#0284c7' },
              { label: 'Total Photos', value: stats.totalMedia, icon: '🖼️', color: '#7c3aed' },
              { label: 'Total Likes', value: stats.totalLikes, icon: '❤️', color: '#dc2626' },
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                <div>
                  <p style={{ ...styles.statNum, color: s.color }}>{s.value}</p>
                  <p style={styles.statLabel}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent uploads */}
          <h2 style={styles.sectionTitle}>Recent Uploads</h2>
          <div style={styles.recentGrid}>
            {recentMedia.map((item) => (
              <Link key={item.id} to={`/photo/${item.id}`} style={styles.recentCard}>
                <img
                  src={item.thumbnailUrl || item.url}
                  alt=""
                  style={styles.recentImg}
                />
                <div style={styles.recentInfo}>
                  <p style={styles.recentEvent}>{item.event.name}</p>
                  <p style={styles.recentUploader}>by {item.uploader.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <>
          <p style={styles.userCount}>{users.length} registered users</p>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Photos</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.miniAvatar}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <Link to={`/profile/${u.id}`} style={styles.userNameLink}>
                          {u.name}
                        </Link>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.emailText}>{u.email}</span>
                    </td>
                    <td style={styles.td}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{
                          ...styles.roleSelect,
                          color: roleColor[u.role],
                          borderColor: roleColor[u.role] + '44',
                          background: roleColor[u.role] + '0f',
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {u._count.media}
                    </td>
                    <td style={styles.td}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' },
  tab: {
    padding: '0.5rem 1.25rem', border: 'none',
    borderRadius: '8px', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '500',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  statCard: {
    background: '#fff', borderRadius: '12px',
    border: '1px solid #e5e7eb', padding: '1.25rem',
    display: 'flex', gap: '1rem', alignItems: 'center',
  },
  statNum: { fontSize: '1.75rem', fontWeight: '700', lineHeight: 1 },
  statLabel: { fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' },
  sectionTitle: {
    fontSize: '1.1rem', fontWeight: '600',
    color: '#374151', marginBottom: '1rem',
  },
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.75rem',
  },
  recentCard: {
    background: '#fff', borderRadius: '8px',
    border: '1px solid #e5e7eb', overflow: 'hidden',
    textDecoration: 'none', color: 'inherit', display: 'block',
  },
  recentImg: { width: '100%', height: '110px', objectFit: 'cover', display: 'block' },
  recentInfo: { padding: '0.5rem 0.65rem' },
  recentEvent: { fontSize: '0.75rem', fontWeight: '600', color: '#111827' },
  recentUploader: { fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' },
  userCount: { color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' },
  tableWrapper: { overflowX: 'auto', borderRadius: '10px', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '0.875rem' },
  tableHead: { background: '#f9fafb' },
  th: {
    padding: '0.75rem 1rem', textAlign: 'left',
    fontWeight: '600', color: '#374151', fontSize: '0.8rem',
    borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '0.75rem 1rem', color: '#374151', verticalAlign: 'middle' },
  userCell: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  miniAvatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: '#4f46e5', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.75rem', flexShrink: 0,
  },
  userNameLink: { color: '#111827', textDecoration: 'none', fontWeight: '500' },
  emailText: { color: '#6b7280', fontSize: '0.8rem' },
  roleSelect: {
    padding: '3px 8px', borderRadius: '6px',
    border: '1px solid', fontSize: '0.8rem',
    fontWeight: '600', cursor: 'pointer', outline: 'none',
  },
  deleteBtn: {
    padding: '4px 10px', background: '#fef2f2',
    color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem',
    fontWeight: '500',
  },
  center: { textAlign: 'center', padding: '3rem', color: '#6b7280' },
}