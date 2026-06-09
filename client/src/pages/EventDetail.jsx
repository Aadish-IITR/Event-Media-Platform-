import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`)
      setEvent(res.data.event)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load event.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    try {
      await api.delete(`/events/${id}`)
      navigate('/events')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete event.')
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  if (loading) return <div style={styles.center}>Loading event...</div>
  if (error) return (
    <div style={styles.page}>
      <div style={styles.errorBox}>
        <p>{error}</p>
        <Link to="/events" style={{ color: '#4f46e5', marginTop: '0.5rem', display: 'inline-block' }}>
          ← Back to Events
        </Link>
      </div>
    </div>
  )
  if (!event) return null

  const isOwner = user?.id === event.createdById
  const isAdmin = user?.role === 'ADMIN'
  const canUpload = user && (user.role === 'ADMIN' || user.role === 'PHOTOGRAPHER')

  return (
    <div style={styles.page}>
      {/* Back */}
      <Link to="/events" style={styles.backLink}>← All Events</Link>

      {/* Event Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.badges}>
            <span style={{
              ...styles.badge,
              background: event.isPublic ? '#dcfce7' : '#fef9c3',
              color: event.isPublic ? '#166534' : '#854d0e',
            }}>
              {event.isPublic ? '🌍 Public' : '🔒 Private'}
            </span>
            <span style={styles.catBadge}>{event.category}</span>
          </div>
          <h1 style={styles.title}>{event.name}</h1>
          <p style={styles.date}>📅 {formatDate(event.date)}</p>
          {event.description && <p style={styles.desc}>{event.description}</p>}
          <p style={styles.meta}>
            Created by <strong>{event.createdBy.name}</strong> · {event._count.media} photo{event._count.media !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {canUpload && (
            <Link to={`/upload?eventId=${event.id}`} style={styles.uploadBtn}>
              ⬆️ Upload Photos
            </Link>
          )}
          {(isOwner || isAdmin) && (
            <button onClick={handleDelete} style={styles.deleteBtn}>
              🗑️ Delete Event
            </button>
          )}
        </div>
      </div>

      {/* Media Grid */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Photos ({event.media.length})
        </h2>

        {event.media.length === 0 ? (
          <div style={styles.emptyMedia}>
            <p style={{ fontSize: '2.5rem' }}>📷</p>
            <p style={{ fontWeight: '600', marginTop: '0.5rem' }}>No photos yet</p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {canUpload ? 'Be the first to upload photos for this event!' : 'Photos will appear here once uploaded.'}
            </p>
            {canUpload && (
              <Link to={`/upload?eventId=${event.id}`} style={{ ...styles.uploadBtn, marginTop: '1rem', display: 'inline-block' }}>
                ⬆️ Upload Photos
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {event.media.map((item) => (
                <Link key={item.id} to={`/photo/${item.id}`} style={{ ...styles.photoCard, textDecoration: 'none', color: 'inherit' }}>
                <img
                  src={item.thumbnailUrl || item.url}
                  alt="Event photo"
                  style={styles.photo}
                  loading="lazy"
                />
                <div style={styles.photoFooter}>
                  <span style={styles.photoUploader}>by {item.uploader.name}</span>
                  <span style={styles.photoLikes}>❤️ {item.likesCount}</span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div style={styles.tags}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  backLink: {
    fontSize: '0.85rem',
    color: '#6b7280',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  headerLeft: { flex: 1 },
  badges: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' },
  badge: {
    fontSize: '0.75rem', fontWeight: '600',
    padding: '3px 10px', borderRadius: '20px',
  },
  catBadge: {
    fontSize: '0.75rem', fontWeight: '600',
    padding: '3px 10px', borderRadius: '20px',
    background: '#ede9fe', color: '#5b21b6',
  },
  title: {
    fontSize: '2rem', fontWeight: '700',
    color: '#111827', marginBottom: '0.4rem',
  },
  date: { fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.6rem' },
  desc: {
    fontSize: '1rem', color: '#4b5563',
    lineHeight: '1.6', marginBottom: '0.75rem', maxWidth: '600px',
  },
  meta: { fontSize: '0.85rem', color: '#9ca3af' },
  actions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  uploadBtn: {
    padding: '0.6rem 1.25rem',
    background: '#4f46e5', color: '#fff',
    borderRadius: '8px', fontWeight: '600',
    textDecoration: 'none', fontSize: '0.9rem',
  },
  deleteBtn: {
    padding: '0.6rem 1.25rem',
    background: '#fef2f2', color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px', fontWeight: '600',
    fontSize: '0.9rem', cursor: 'pointer',
  },
  section: { marginTop: '1rem' },
  sectionTitle: {
    fontSize: '1.2rem', fontWeight: '600',
    color: '#111827', marginBottom: '1rem',
  },
  emptyMedia: {
    textAlign: 'center', padding: '4rem 2rem',
    background: '#f9fafb', borderRadius: '12px',
    border: '2px dashed #e5e7eb',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  photoCard: {
    background: '#fff', borderRadius: '10px',
    overflow: 'hidden', border: '1px solid #e5e7eb',
  },
  photo: {
    width: '100%', height: '180px',
    objectFit: 'cover', display: 'block',
  },
  photoFooter: {
    display: 'flex', justifyContent: 'space-between',
    padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#6b7280',
  },
  photoUploader: { color: '#6b7280' },
  photoLikes: { color: '#ef4444' },
  tags: {
    display: 'flex', gap: '0.3rem',
    flexWrap: 'wrap', padding: '0 0.75rem 0.6rem',
  },
  tag: {
    fontSize: '0.65rem', padding: '2px 7px',
    background: '#f3f4f6', color: '#374151',
    borderRadius: '20px',
  },
  center: { textAlign: 'center', padding: '3rem', color: '#6b7280' },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', borderRadius: '8px', padding: '1.5rem',
  },
}