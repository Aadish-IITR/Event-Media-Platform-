import { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LikeButton({ mediaId, initialLiked, initialCount, onUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount || 0)
  const [loading, setLoading] = useState(false)

  const handleLike = async (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    if (loading) return
    setLoading(true)

    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : count - 1
    setLiked(newLiked)
    setCount(newCount)

    try {
      await api.post(`/media/${mediaId}/like`)
      if (onUpdate) onUpdate(newLiked, newCount)
    } catch (err) {
      // Revert on error
      setLiked(liked)
      setCount(count)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 14px',
        background: liked ? '#fef2f2' : '#f9fafb',
        border: `1px solid ${liked ? '#fecaca' : '#e5e7eb'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: liked ? '#dc2626' : '#374151',
        transition: 'all 0.15s',
        transform: loading ? 'scale(0.96)' : 'scale(1)',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  )
}