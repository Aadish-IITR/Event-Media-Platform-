import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['All', 'General', 'Cultural', 'Sports', 'Workshop', 'Trip', 'Party', 'Competition']

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('date')

  useEffect(() => {
    fetchEvents()
  }, [sort, category])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = { sort }
      if (category !== 'All') params.category = category
      if (search) params.search = search

      const res = await api.get('/events', { params })
      setEvents(res.data.events)
    } catch (err) {
      setError('Failed to load events.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEvents()
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Events</h1>
          <p style={styles.subtitle}>{events.length} event{events.length !== 1 ? 's' : ''} found</p>
        </div>
        {user && (user.role === 'ADMIN' || user.role === 'PHOTOGRAPHER') && (
          <Link to="/events/create" style={styles.createBtn}>
            + Create Event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>

        <div style={styles.filterGroup}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={styles.select}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              ...styles.catBtn,
              background: category === cat ? '#4f46e5' : '#f3f4f6',
              color: category === cat ? '#fff' : '#374151',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.center}>Loading events...</div>
      ) : error ? (
        <div style={styles.errorBox}>{error}</div>
      ) : events.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '3rem' }}>📭</p>
          <p style={{ fontWeight: '600', marginTop: '0.5rem' }}>No events found</p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {user ? 'Create the first event!' : 'Check back later.'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, formatDate }) {
  return (
    <Link to={`/events/${event.id}`} style={styles.card}>
      {/* Cover image or placeholder */}
      <div style={{
        ...styles.cardImage,
        background: event.coverUrl ? `url(${event.coverUrl}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={styles.cardBadges}>
          <span style={{
            ...styles.badge,
            background: event.isPublic ? '#dcfce7' : '#fef9c3',
            color: event.isPublic ? '#166534' : '#854d0e',
          }}>
            {event.isPublic ? '🌍 Public' : '🔒 Private'}
          </span>
          <span style={styles.categoryBadge}>{event.category}</span>
        </div>
      </div>

      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{event.name}</h3>
        <p style={styles.cardDate}>📅 {formatDate(event.date)}</p>
        {event.description && (
          <p style={styles.cardDesc}>
            {event.description.length > 80
              ? event.description.slice(0, 80) + '...'
              : event.description}
          </p>
        )}
        <div style={styles.cardFooter}>
          <span style={styles.photoCount}>🖼️ {event._count.media} photos</span>
          <span style={styles.creator}>by {event.createdBy.name}</span>
        </div>
      </div>
    </Link>
  )
}

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginTop: '0.2rem',
  },
  createBtn: {
    padding: '0.6rem 1.25rem',
    background: '#4f46e5',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  searchForm: {
    display: 'flex',
    gap: '0.5rem',
    flex: 1,
    minWidth: '220px',
  },
  searchInput: {
    flex: 1,
    padding: '0.6rem 0.85rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  searchBtn: {
    padding: '0.6rem 1.2rem',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  filterGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  select: {
    padding: '0.6rem 0.85rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.9rem',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  categoryRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1.75rem',
  },
  catBtn: {
    padding: '0.35rem 0.9rem',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'block',
  },
  cardImage: {
    height: '160px',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    padding: '0.75rem',
  },
  cardBadges: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '20px',
  },
  categoryBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.9)',
    color: '#374151',
  },
  cardBody: {
    padding: '1rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.3rem',
  },
  cardDate: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#4b5563',
    lineHeight: '1.5',
    marginBottom: '0.75rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f3f4f6',
  },
  photoCount: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  creator: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  center: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#374151',
  },
}