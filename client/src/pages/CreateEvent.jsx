import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

const CATEGORIES = ['General', 'Cultural', 'Sports', 'Workshop', 'Trip', 'Party', 'Competition']

export default function CreateEvent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'General',
    date: '',
    isPublic: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/events', form)
      navigate(`/events/${res.data.event.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Back link */}
        <Link to="/events" style={styles.backLink}>← Back to Events</Link>

        <h1 style={styles.title}>Create New Event</h1>
        <p style={styles.subtitle}>Fill in the details for your event</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Event Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Annual Photography Contest 2025"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this event about?"
              rows={4}
              style={{ ...styles.input, resize: 'vertical' }}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={styles.input}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Event Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="isPublic"
              id="isPublic"
              checked={form.isPublic}
              onChange={handleChange}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="isPublic" style={styles.checkboxLabel}>
              <span style={{ fontWeight: '500' }}>Make this event public</span>
              <span style={styles.checkboxHint}>
                {form.isPublic
                  ? 'Anyone can view this event and its photos'
                  : 'Only logged-in members can view this event'}
              </span>
            </label>
          </div>

          <div style={styles.actions}>
            <Link to="/events" style={styles.cancelBtn}>Cancel</Link>
            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    padding: '2rem 1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '680px',
    margin: '0 auto',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  backLink: {
    fontSize: '0.85rem',
    color: '#6b7280',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginBottom: '1.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '0.65rem 0.85rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#fff',
    width: '100%',
    fontFamily: 'inherit',
  },
  checkboxRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  checkboxLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    cursor: 'pointer',
  },
  checkboxHint: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    padding: '0.65rem 1.5rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#374151',
    fontWeight: '500',
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  submitBtn: {
    padding: '0.65rem 2rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    marginBottom: '0.5rem',
  },
}