import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (err) {
      // Silently fail — don't break the app
    }
  }

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      // Mark as read when opening
      try {
        await api.put('/notifications/read')
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      } catch (err) {}
    }
  }

  const handleNotifClick = (notif) => {
    if (notif.mediaId) navigate(`/photo/${notif.mediaId}`)
    setOpen(false)
  }

  const getNotifText = (notif) => {
    switch (notif.type) {
      case 'LIKE': return `${notif.actor.name} liked your photo`
      case 'COMMENT': return `${notif.actor.name} commented on your photo`
      case 'TAG': return `${notif.actor.name} tagged you in a photo`
      default: return 'New notification'
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={handleOpen} style={styles.bell}>
        <span style={{ fontSize: '1.2rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    await Promise.all(
                      notifications.map((n) => api.delete(`/notifications/${n.id}`))
                    )
                    setNotifications([])
                    setUnreadCount(0)
                  } catch {}
                }}
                style={styles.clearAll}
              >
                Clear all
              </button>
            )}
          </div>

          <div style={styles.notifList}>
            {notifications.length === 0 ? (
              <p style={styles.empty}>No notifications yet</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    ...styles.notifItem,
                    background: notif.isRead ? 'transparent' : '#eef2ff',
                  }}
                >
                  <div style={styles.notifAvatar}>
                    {notif.actor.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.notifContent}>
                    <p style={styles.notifText}>{getNotifText(notif)}</p>
                    <p style={styles.notifTime}>{timeAgo(notif.createdAt)}</p>
                  </div>
                  {notif.media?.thumbnailUrl && (
                    <img
                      src={notif.media.thumbnailUrl}
                      alt=""
                      style={styles.notifThumb}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  bell: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    background: '#dc2626',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '1px 4px',
    minWidth: '16px',
    textAlign: 'center',
    lineHeight: '14px',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    width: '320px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #f3f4f6',
  },
  dropTitle: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#111827',
  },
  clearAll: {
    fontSize: '0.75rem',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  notifList: {
    maxHeight: '340px',
    overflowY: 'auto',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem',
    padding: '2rem 1rem',
  },
  notifItem: {
    display: 'flex',
    gap: '0.7rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    alignItems: 'center',
    borderBottom: '1px solid #f9fafb',
    transition: 'background 0.15s',
  },
  notifAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifText: {
    fontSize: '0.8rem',
    color: '#111827',
    lineHeight: '1.4',
    fontWeight: '500',
  },
  notifTime: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    marginTop: '2px',
  },
  notifThumb: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0,
  },
}