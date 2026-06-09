const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../db') // Import the shared Prisma instance here
const { protect } = require('../middleware/auth')

const router = express.Router()

// Helper: generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// ─── REGISTER ───────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Only allow safe roles on register (no self-assigning ADMIN)
    const allowedRoles = ['VIEWER', 'PHOTOGRAPHER', 'MEMBER']
    const assignedRole = allowedRoles.includes(role) ? role : 'VIEWER'

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    const token = generateToken(user.id)

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user,
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error during registration.' })
  }
})

// ─── LOGIN ───────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = generateToken(user.id)

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error during login.' })
  }
})

// ─── GET CURRENT USER ────────────────────────────────────────
// GET /api/auth/me  (protected)
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router