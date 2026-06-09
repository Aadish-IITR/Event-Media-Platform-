import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom' // 👈 Added Navigate here
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import Upload from './pages/Upload'
import PhotoDetail from './pages/PhotoDetail'
import Search from './pages/Search'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'


// Home Page
function Home() {
  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          color: '#111827',
          marginBottom: '1rem',
        }}
      >
        🎯 Event Media Platform
      </h1>

      <p
        style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          marginBottom: '2rem',
        }}
      >
        Organize, share, and discover event photos in one place
      </p>

      <Link
        to="/events"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: '#4f46e5',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '1rem',
          textDecoration: 'none',
        }}
      >
        Browse Events →
      </Link>
    </div>
  )
}

// Protected Route
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading...
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

//AdminRoute
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

// Guest-only Route
function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading...
      </div>
    )
  }

  return !user ? children : <Navigate to="/" replace />
}

// App Routes
function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/create" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/photo/:id" element={<PhotoDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}


// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
