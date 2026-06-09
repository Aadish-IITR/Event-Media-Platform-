const express = require('express')
const prisma = require('../db') 
const { protect, restrictTo } = require('../middleware/auth')

const router = express.Router()

// GET /api/users/profile/:id  — public profile
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { media: true, events: true },
        },
      },
    })

    if (!user) return res.status(404).json({ error: 'User not found.' })

    const recentMedia = await prisma.media.findMany({
      where: { uploaderId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        event: { select: { id: true, name: true } },
      },
    })

    res.json({ user, media: recentMedia })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' })
  }
})

// GET /api/users/me/favourites  — my saved photos (protected)
router.get('/me/favourites', protect, async (req, res) => {
  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          include: {
            event: { select: { id: true, name: true } },
            uploader: { select: { id: true, name: true } },
          },
        },
      },
    })
    res.json({ favourites: favourites.map((f) => f.media) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favourites.' })
  }
})

// ─── ADMIN ONLY ROUTES ───────────────────────────────────────

// GET /api/users  — list all users (Admin only)
router.get('/', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { media: true, events: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' })
  }
})

// PUT /api/users/:id/role  — change user role (Admin only)
router.put('/:id/role', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body
    const validRoles = ['ADMIN', 'PHOTOGRAPHER', 'MEMBER', 'VIEWER']

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' })
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })

    res.json({ message: 'Role updated.', user: updated })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' })
  }
})

// DELETE /api/users/:id  — delete user (Admin only)
router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ message: 'User deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' })
  }
})

// GET /api/users/admin/stats  — platform stats (Admin only)
router.get('/admin/stats', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalMedia, totalLikes, recentMedia] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.media.count(),
      prisma.like.count(),
      prisma.media.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { name: true } },
          event: { select: { name: true } },
        },
      }),
    ])

    res.json({
      stats: { totalUsers, totalEvents, totalMedia, totalLikes },
      recentMedia,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' })
  }
})

module.exports = router