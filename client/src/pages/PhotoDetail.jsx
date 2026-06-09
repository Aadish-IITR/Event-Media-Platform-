import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import LikeButton from '../components/LikeButton'
import CommentSection from '../components/CommentSection'

export default function PhotoDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [media, setMedia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favourited, setFavourited] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMedia()
  }, [id])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/media/${id}`)
      setMedia(res.data.media)

      // Check if current user has favourited this
      if (user) {
        const liked = res.data.media.likes?.some((l) => l.userId === user.id)
        setFavourited(false) // We'll check favourites separately below
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Photo not found.')
    } finally {
      setLoading(false)
    }
  }

  const handleFavourite = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/media/${id}/favourite`)
      setFavourited(res.data.favourited)
    } catch (err) {
      alert('Failed to update favourites.')
    }
  }

  const handleDownload = async () => {
    if (!user) { navigate('/login'); return }
    setDownloading(true)
    try {
      const response = await api.get(`/download/${id}`, {
        responseType: 'blob',
      })

      // Create a temporary link and click it to trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `photo_${id}.jpg`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this photo permanently?')) return
    setDeleting(true)
    try {
      await api.delete(`/media/${id}`)
      navigate(`/events/${media.event.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.')
      setDeleting(false)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    } else {
      prompt('Copy this link:', url)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading photo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <p>{error}</p>
          <Link to="/events" style={{ color: '#4f46e5', marginTop: '0.5rem', display: 'inline-block' }}>
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  if (!media) return null

  const isOwner = user?.id === media.uploaderId
  const isAdmin = user?.role === 'ADMIN'
  const userLiked = media.likes?.some((l) => l.userId === user?.id)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <Link to="/events" style={styles.breadLink}>Events</Link>
          <span style={styles.breadSep}>/</span>
          <Link to={`/events/${media.event.id}`} style={styles.breadLink}>
            {media.event.name}
          </Link>
          <span style={styles.breadSep}>/</span>
          <span style={{ color: '#6b7280' }}>Photo</span>
        </div>

        <div style={styles.layout}>
          {/* LEFT — Photo */}
          <div style={styles.imageSection}>
            <div style={styles.imageWrapper}>
              <img
                src={media.url}
                alt="Event photo"
                style={styles.image}
              />
            </div>

            {/* Action bar */}
            <div style={styles.actionBar}>
              <div style={styles.actionLeft}>
                <LikeButton
                  mediaId={media.id}
                  initialLiked={userLiked}
                  initialCount={media.likesCount}
                />

                <button onClick={handleFavourite} style={{
                  ...styles.actionBtn,
                  background: favourited ? '#fffbeb' : '#f9fafb',
                  borderColor: favourited ? '#fde68a' : '#e5e7eb',
                  color: favourited ? '#d97706' : '#374151',
                }}>
                  {favourited ? '⭐ Saved' : '☆ Save'}
                </button>

                <button onClick={handleShare} style={styles.actionBtn}>
                  🔗 Share
                </button>
              </div>

              <div style={styles.actionRight}>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{
                    ...styles.downloadBtn,
                    opacity: downloading ? 0.7 : 1,
                  }}
                >
                  {downloading ? '⏳ Processing...' : '⬇️ Download'}
                </button>

                {(isOwner || isAdmin) && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={styles.deleteBtn}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Info + Comments */}
          <div style={styles.infoSection}>
            {/* Uploader */}
            <div style={styles.uploader}>
              <div style={styles.uploaderAvatar}>
                {media.uploader.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={styles.uploaderName}>{media.uploader.name}</p>
                <p style={styles.uploadDate}>{formatDate(media.createdAt)}</p>
              </div>
            </div>

            {/* Event link */}
            <Link to={`/events/${media.event.id}`} style={styles.eventLink}>
              📅 {media.event.name}
            </Link>

            {/* AI Tags */}
            {media.tags && media.tags.length > 0 && (
              <div style={styles.tagsSection}>
                <p style={styles.tagsLabel}>🏷️ AI Tags</p>
                <div style={styles.tags}>
                  {media.tags.map((tag) => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '1.25rem 0' }} />

            {/* Comments */}
            <CommentSection
              mediaId={media.id}
              initialComments={media.comments || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    background: '#f3f4f6',
    minHeight: '100vh',
    padding: '1.5rem 1rem',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
  },
  breadLink: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '500',
  },
  breadSep: { color: '#d1d5db' },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  imageSection: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  imageWrapper: {
    background: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    maxHeight: '70vh',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    maxHeight: '70vh',
    display: 'block',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
    borderTop: '1px solid #f3f4f6',
  },
  actionLeft: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actionRight: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtn: {
    padding: '7px 14px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s',
  },
  downloadBtn: {
    padding: '7px 16px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '7px 12px',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  infoSection: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #e5e7eb',
  },
  uploader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  uploaderAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1rem',
    flexShrink: 0,
  },
  uploaderName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#111827',
  },
  uploadDate: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '1px',
  },
  eventLink: {
    display: 'inline-block',
    fontSize: '0.825rem',
    color: '#4f46e5',
    fontWeight: '500',
    textDecoration: 'none',
    background: '#eef2ff',
    padding: '4px 10px',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  tagsSection: { marginBottom: '0.5rem' },
  tagsLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
  },
  tag: {
    fontSize: '0.75rem',
    padding: '3px 10px',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
  },
  center: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
  errorBox: {
    maxWidth: '480px',
    margin: '2rem auto',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '1.5rem',
  },
}