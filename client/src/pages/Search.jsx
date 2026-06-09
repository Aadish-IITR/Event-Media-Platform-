import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'

const TABS = ['all', 'events', 'photos', 'users']

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('all')
  const [results, setResults] = useState(null)
  const [total, setTotal] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  }, [])

  const doSearch = async (q) => {
    if (!q || q.trim().length < 2) {
      setError('Please enter at least 2 characters.')
      return
    }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await api.get('/search', { params: { q: q.trim(), type: 'all' } })
      setResults(res.data.results)
      setTotal(res.data.total)
      setSearchParams({ q: q.trim() })
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    doSearch(query)
  }

  const totalCount = (total.events || 0) + (total.photos || 0) + (total.users || 0)

  return (
    <div style={styles.page}>
      {/* Search bar */}
      <div style={styles.searchHeader}>
        <h1 style={styles.title}>Search</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, photos by tag, or users..."
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.searchBtn} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Results */}
      {results && (
        <>
          <p style={styles.resultCount}>
            {totalCount} result{totalCount !== 1 ? 's' : ''} for <strong>"{searchParams.get('q')}"</strong>
          </p>

          {/* Tabs */}
          <div style={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tab,
                  background: activeTab === tab ? '#4f46e5' : '#f3f4f6',
                  color: activeTab === tab ? '#fff' : '#374151',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && (
                  <span style={styles.tabCount}>
                    {total[tab] || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Events results */}
          {(activeTab === 'all' || activeTab === 'events') && results.events?.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📅 Events ({results.events.length})</h2>
              <div style={styles.eventGrid}>
                {results.events.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`} style={styles.eventCard}>
                    <div style={styles.eventCardInner}>
                      <span style={styles.catBadge}>{event.category}</span>
                      <h3 style={styles.eventName}>{event.name}</h3>
                      <p style={styles.eventMeta}>
                        {new Date(event.date).toLocaleDateString()} · {event._count.media} photos
                      </p>
                      <p style={styles.eventCreator}>by {event.createdBy.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Photos results */}
          {(activeTab === 'all' || activeTab === 'photos') && results.photos?.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🖼️ Photos ({results.photos.length})</h2>
              <div style={styles.photoGrid}>
                {results.photos.map((photo) => (
                  <Link key={photo.id} to={`/photo/${photo.id}`} style={styles.photoCard}>
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt="search result"
                      style={styles.photoImg}
                      loading="lazy"
                    />
                    <div style={styles.photoOverlay}>
                      <p style={styles.photoEvent}>{photo.event.name}</p>
                      {photo.tags?.slice(0, 2).map((t) => (
                        <span key={t} style={styles.photoTag}>{t}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Users results */}
          {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>👤 Users ({results.users.length})</h2>
              <div style={styles.userList}>
                {results.users.map((u) => (
                  <Link key={u.id} to={`/profile/${u.id}`} style={styles.userCard}>
                    <div style={styles.userAvatar}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={styles.userName}>{u.name}</p>
                      <p style={styles.userMeta}>{u.role} · {u._count.media} photos</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <div style={styles.empty}>
              <p style={{ fontSize: '2.5rem' }}>🔍</p>
              <p style={{ fontWeight: '600', marginTop: '0.5rem' }}>No results found</p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Try different keywords or check the spelling
              </p>
            </div>
          )}
        </>
      )}

      {!results && !loading && (
        <div style={styles.hint}>
          <p style={{ fontSize: '2rem' }}>💡</p>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Try searching for: event names, photo tags like "sports" or "mountains", or usernames
          </p>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' },
  searchHeader: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' },
  form: { display: 'flex', gap: '0.75rem' },
  input: {
    flex: 1, padding: '0.7rem 1rem',
    border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '1rem', outline: 'none',
  },
  searchBtn: {
    padding: '0.7rem 1.5rem', background: '#4f46e5',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
    whiteSpace: 'nowrap',
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', borderRadius: '8px',
    padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem',
  },
  resultCount: { color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: {
    padding: '0.4rem 1rem', border: 'none',
    borderRadius: '20px', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: '500',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  tabCount: {
    background: 'rgba(255,255,255,0.3)',
    padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem',
  },
  section: { marginBottom: '2rem' },
  sectionTitle: {
    fontSize: '1rem', fontWeight: '600',
    color: '#374151', marginBottom: '0.85rem',
  },
  eventGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  eventCard: {
    background: '#fff', borderRadius: '10px',
    border: '1px solid #e5e7eb', textDecoration: 'none',
    color: 'inherit', display: 'block',
  },
  eventCardInner: { padding: '1rem' },
  catBadge: {
    fontSize: '0.7rem', fontWeight: '600',
    padding: '2px 8px', borderRadius: '20px',
    background: '#ede9fe', color: '#5b21b6',
    display: 'inline-block', marginBottom: '0.5rem',
  },
  eventName: { fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.3rem' },
  eventMeta: { fontSize: '0.8rem', color: '#6b7280' },
  eventCreator: { fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.75rem',
  },
  photoCard: {
    position: 'relative', borderRadius: '8px',
    overflow: 'hidden', display: 'block',
    border: '1px solid #e5e7eb',
  },
  photoImg: { width: '100%', height: '130px', objectFit: 'cover', display: 'block' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: '0.5rem',
  },
  photoEvent: { fontSize: '0.7rem', color: '#fff', fontWeight: '500', marginBottom: '3px' },
  photoTag: {
    fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)',
    color: '#fff', padding: '1px 6px', borderRadius: '10px',
    marginRight: '3px',
  },
  userList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  userCard: {
    display: 'flex', gap: '0.75rem', alignItems: 'center',
    padding: '0.85rem 1rem', background: '#fff',
    borderRadius: '10px', border: '1px solid #e5e7eb',
    textDecoration: 'none', color: 'inherit',
  },
  userAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: '#4f46e5', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '1rem', flexShrink: 0,
  },
  userName: { fontWeight: '600', fontSize: '0.9rem', color: '#111827' },
  userMeta: { fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' },
  empty: { textAlign: 'center', padding: '3rem', color: '#374151' },
  hint: { textAlign: 'center', padding: '3rem', color: '#9ca3af' },
}