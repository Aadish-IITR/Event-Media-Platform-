import { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function CommentSection({ mediaId, initialComments }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [comments, setComments] = useState(initialComments || [])
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const handlePost = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!body.trim()) return

    setPosting(true)
    setError('')
    try {
      const res = await api.post(`/media/${mediaId}/comments`, { body })
      setComments([res.data.comment, ...comments])
      setBody('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post comment.')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/media/comments/${commentId}`)
      setComments(comments.filter((c) => c.id !== commentId))
    } catch (err) {
      alert('Failed to delete comment.')
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
    <div>
      <h3 style={styles.heading}>
        💬 Comments ({comments.length})
      </h3>

      {/* Input */}
      {user ? (
        <form onSubmit={handlePost} style={styles.form}>
          <div style={styles.inputRow}>
            <div style={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <input
              type="text"
              value={body}
              onChange={(e) => { setBody(e.target.value); setError('') }}
              placeholder="Write a comment..."
              style={styles.input}
              maxLength={300}
            />
            <button
              type="submit"
              disabled={posting || !body.trim()}
              style={{
                ...styles.postBtn,
                opacity: posting || !body.trim() ? 0.5 : 1,
              }}
            >
              {posting ? '...' : 'Post'}
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      ) : (
        <div style={styles.loginPrompt}>
          <button onClick={() => navigate('/login')} style={styles.loginBtn}>
            Log in to comment
          </button>
        </div>
      )}

      {/* Comments list */}
      <div style={styles.list}>
        {comments.length === 0 ? (
          <p style={styles.empty}>No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} style={styles.comment}>
              <div style={styles.commentAvatar}>
                {comment.user.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.commentBody}>
                <div style={styles.commentHeader}>
                  <span style={styles.commentName}>{comment.user.name}</span>
                  <span style={styles.commentTime}>{timeAgo(comment.createdAt)}</span>
                </div>
                <p style={styles.commentText}>{comment.body}</p>
              </div>
              {/* Delete button — only own comments or admin */}
              {user && (user.id === comment.user.id || user.role === 'ADMIN') && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  style={styles.deleteBtn}
                  title="Delete comment"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  heading: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
  },
  form: {
    marginBottom: '1.25rem',
  },
  inputRow: {
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'center',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '0.55rem 0.85rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  postBtn: {
    padding: '0.55rem 1rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  error: {
    color: '#dc2626',
    fontSize: '0.8rem',
    marginTop: '0.4rem',
    marginLeft: '42px',
  },
  loginPrompt: {
    marginBottom: '1rem',
  },
  loginBtn: {
    padding: '0.5rem 1.25rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#4f46e5',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  empty: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontStyle: 'italic',
    padding: '1rem 0',
  },
  comment: {
    display: 'flex',
    gap: '0.65rem',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#e5e7eb',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.75rem',
    flexShrink: 0,
  },
  commentBody: {
    flex: 1,
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '0.6rem 0.85rem',
  },
  commentHeader: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'baseline',
    marginBottom: '0.2rem',
  },
  commentName: {
    fontWeight: '600',
    fontSize: '0.825rem',
    color: '#111827',
  },
  commentTime: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  commentText: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.5',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    opacity: 0.5,
    padding: '4px',
    flexShrink: 0,
  },
}