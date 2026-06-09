import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Upload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [files, setFiles] = useState([])         // { file, preview, status, progress }
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // When files are dropped
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',   // pending | uploading | done | error
      id: Math.random().toString(36).slice(2),
    }))
    setFiles((prev) => [...prev, ...newFiles])
    setDone(false)
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleUpload = async () => {
    if (!eventId) {
      setError('No event selected. Please go back and select an event.')
      return
    }
    if (files.length === 0) {
      setError('Please add at least one photo.')
      return
    }

    setUploading(true)
    setError('')

    // Mark all as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' })))

    try {
      const formData = new FormData()
      formData.append('eventId', eventId)
      files.forEach((f) => formData.append('photos', f.file))

      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          // Optional: you could use this for a real progress bar
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percent}%`)
        },
      })

      // Mark all as done
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' })))
      setDone(true)

    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.')
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' })))
    } finally {
      setUploading(false)
    }
  }

  const handleUploadMore = () => {
    setFiles([])
    setDone(false)
    setError('')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          {eventId ? (
            <Link to={`/events/${eventId}`} style={styles.backLink}>← Back to Event</Link>
          ) : (
            <Link to="/events" style={styles.backLink}>← Back to Events</Link>
          )}
          <h1 style={styles.title}>Upload Photos</h1>
          <p style={styles.subtitle}>
            {eventId
              ? 'Drag and drop photos to upload them to this event'
              : '⚠️ No event selected — go to an event page and click Upload Photos'}
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {done ? (
          // Success state
          <div style={styles.successBox}>
            <p style={{ fontSize: '3rem' }}>🎉</p>
            <h2 style={{ fontWeight: '700', color: '#166534', marginTop: '0.5rem' }}>
              {files.length} photo{files.length !== 1 ? 's' : ''} uploaded!
            </h2>
            <p style={{ color: '#4b5563', marginTop: '0.3rem' }}>
              AI tags have been generated automatically.
            </p>
            <div style={styles.successActions}>
              <Link to={`/events/${eventId}`} style={styles.viewBtn}>
                View Event Gallery →
              </Link>
              <button onClick={handleUploadMore} style={styles.moreBtn}>
                Upload More
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              style={{
                ...styles.dropzone,
                borderColor: isDragActive ? '#4f46e5' : '#d1d5db',
                background: isDragActive ? '#eef2ff' : '#fafafa',
              }}
            >
              <input {...getInputProps()} />
              <div style={styles.dropContent}>
                <p style={{ fontSize: '3rem' }}>📷</p>
                {isDragActive ? (
                  <p style={styles.dropText}>Drop photos here...</p>
                ) : (
                  <>
                    <p style={styles.dropText}>Drag & drop photos here</p>
                    <p style={styles.dropHint}>or click to browse files</p>
                    <p style={styles.dropLimit}>
                      JPG, PNG, WEBP · Max 10MB per file · Up to 10 files
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* File previews */}
            {files.length > 0 && (
              <div style={styles.previewSection}>
                <div style={styles.previewHeader}>
                  <span style={styles.previewCount}>
                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                  </span>
                  {!uploading && (
                    <button
                      onClick={() => setFiles([])}
                      style={styles.clearBtn}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div style={styles.previewGrid}>
                  {files.map((f) => (
                    <div key={f.id} style={styles.previewCard}>
                      <img
                        src={f.preview}
                        alt={f.file.name}
                        style={styles.previewImg}
                      />
                      {/* Status overlay */}
                      {f.status === 'uploading' && (
                        <div style={styles.overlay}>
                          <div style={styles.spinner} />
                        </div>
                      )}
                      {f.status === 'done' && (
                        <div style={{ ...styles.overlay, background: 'rgba(22,101,52,0.7)' }}>
                          <span style={{ fontSize: '1.5rem' }}>✅</span>
                        </div>
                      )}
                      {f.status === 'error' && (
                        <div style={{ ...styles.overlay, background: 'rgba(185,28,28,0.7)' }}>
                          <span style={{ fontSize: '1.5rem' }}>❌</span>
                        </div>
                      )}
                      {/* Remove button (only when not uploading) */}
                      {f.status === 'pending' && (
                        <button
                          onClick={() => removeFile(f.id)}
                          style={styles.removeBtn}
                        >
                          ✕
                        </button>
                      )}
                      <div style={styles.previewName}>
                        {f.file.name.length > 16
                          ? f.file.name.slice(0, 14) + '…'
                          : f.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            {files.length > 0 && (
              <button
                onClick={handleUpload}
                disabled={uploading || !eventId}
                style={{
                  ...styles.uploadBtn,
                  opacity: uploading || !eventId ? 0.65 : 1,
                }}
              >
                {uploading
                  ? `Uploading ${files.length} photo${files.length !== 1 ? 's' : ''}...`
                  : `⬆️ Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </>
        )}
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
    maxWidth: '720px',
    margin: '0 auto',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  header: { marginBottom: '1.5rem' },
  backLink: {
    fontSize: '0.85rem',
    color: '#6b7280',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '1rem',
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
  },
  dropzone: {
    border: '2px dashed',
    borderRadius: '12px',
    padding: '2.5rem 1rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '1.5rem',
  },
  dropContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
  },
  dropText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#374151',
  },
  dropHint: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  dropLimit: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
  },
  previewSection: { marginBottom: '1.5rem' },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  previewCount: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  clearBtn: {
    fontSize: '0.8rem',
    color: '#dc2626',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '0.75rem',
  },
  previewCard: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  previewImg: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    display: 'block',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  removeBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  previewName: {
    fontSize: '0.65rem',
    color: '#6b7280',
    padding: '4px 6px',
    background: '#f9fafb',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  uploadBtn: {
    width: '100%',
    padding: '0.85rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  successBox: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    background: '#f0fdf4',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
  },
  successActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1.5rem',
    flexWrap: 'wrap',
  },
  viewBtn: {
    padding: '0.65rem 1.5rem',
    background: '#16a34a',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  moreBtn: {
    padding: '0.65rem 1.5rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#374151',
    fontWeight: '500',
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
    marginBottom: '1rem',
  },
}