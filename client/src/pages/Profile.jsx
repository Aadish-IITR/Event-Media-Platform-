import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [media, setMedia] = useState([])
  const [favourites, setFavourites] = useState([])
  const [activeTab, setActiveTab] = useState('uploads')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = currentUser?.id === id

  useEffect(() => {
    fetchProfile()
    if (isOwnProfile) fetchFavourites()
  }, [id])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/users/profile/${id}`)
      setProfile(res.data.user)
      setMedia(res.data.media)
    } catch (err) {
      setError('Profile not found.')
    } finally {
      setLoading(false)
    }
  }

  const fetchFavourites = async () => {
    try {
      const res = await api.get('/users/me/favourites')
      setFavourites(res.data.favourites)
    } catch {}
  }

  const roleColor = {
    ADMIN: '#dc2626', PHOTOGRAPHER: '#7c3aed',
    MEMBER: '#0284c7', VIEWER: '#6b7280',
  }

  if (loading) return <div style={styles.center}>Loading profile...</div>
  if (error) return <div style={styles.center}>{error}</div>
  if (!profile) return null

  const displayMedia = activeTab === 'uploads' ? media : favourites

  return (
    <div style={styles.page}>
      {/* Profile header */}
      <div style={styles.header}>
        <div style={styles.avatarLarge}>
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div style={styles.headerInfo}>
          <h1 style={styles.name}>{profile.name}</h1>
          <span style={{
            ...styles.roleBadge,
            background: roleColor[profile.role] + '18',
            color: roleColor[profile.role],
          }}>
            {profile.role}
          </span>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{profile._count.media}</span>
              <span style={styles.statLabel}>Photos</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{profile._count.events}</span>
              <span style={styles.statLabel}>Events</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>
                {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
              <span style={styles.statLabel}>Joined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('uploads')}
          style={{ ...styles.tab, borderBottom: activeTab === 'uploads' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'uploads' ? '#4f46e5' : '#6b7280' }}
        >
          📷 Uploads ({media.length})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('favourites')}
            style={{ ...styles.tab, borderBottom: activeTab === 'favourites' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'favourites' ? '#4f46e5' : '#6b7280' }}
          >
            ⭐ Saved ({favourites.length})
          </button>
        )}
      </div>

      {/* Photo grid */}
      {displayMedia.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '2.5rem' }}>
            {activeTab === 'uploads' ? '📷' : '⭐'}
          </p>
          <p style={{ fontWeight: '600', marginTop: '0.5rem' }}>
            {activeTab === 'uploads' ? 'No uploads yet' : 'No saved photos yet'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {displayMedia.map((item) => (
            <Link key={item.id} to={`/photo/${item.id}`} style={styles.photoCard}>
              <img
                src={item.thumbnailUrl || item.url}
                alt="photo"
                style={styles.photo}
                loading="lazy"
              />
              <div style={styles.photoOverlay}>
                <span style={styles.photoLikes}>❤️ {item.likesCount}</span>
                <span style={styles.photoEvent}>{item.event?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' },
  header: {
    display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
    marginBottom: '2rem', flexWrap: 'wrap',
  },
  avatarLarge: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: '#4f46e5', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', fontWeight: '700', flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  name: { fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.4rem' },
  roleBadge: {
    fontSize: '0.75rem', fontWeight: '600',
    padding: '3px 10px', borderRadius: '20px',
    display: 'inline-block', marginBottom: '0.85rem',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  stats: { display: 'flex', gap: '2rem' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum: { fontSize: '1.1rem', fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' },
  tabs: {
    display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb',
    marginBottom: '1.5rem',
  },
  tab: {
    padding: '0.65rem 1.25rem', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
    transition: 'color 0.15s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  },
  photoCard: {
    position: 'relative', borderRadius: '10px',
    overflow: 'hidden', display: 'block',
    border: '1px solid #e5e7eb',
  },
  photo: { width: '100%', height: '180px', objectFit: 'cover', display: 'block' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
    padding: '0.6rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  photoLikes: { fontSize: '0.75rem', color: '#fff' },
  photoEvent: {
    fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)',
    textAlign: 'right', maxWidth: '60%',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  empty: { textAlign: 'center', padding: '4rem 2rem', color: '#374151' },
  center: { textAlign: 'center', padding: '3rem', color: '#6b7280' },
}