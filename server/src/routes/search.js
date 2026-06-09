const express = require('express')
const prisma = require('../db') 
const { protect } = require('../middleware/auth')

const router = express.Router()

// GET /api/search?q=mountains&type=all
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters.' })
    }

    const query = q.trim().toLowerCase()
    const results = {}

    // Search events
    if (type === 'all' || type === 'events') {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
          isPublic: true,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { media: true } },
        },
        take: 10,
      })
    }

    // Search media by tags or event name
    if (type === 'all' || type === 'photos') {
      results.photos = await prisma.media.findMany({
        where: {
          OR: [
            { tags: { has: query } },
            { event: { name: { contains: query, mode: 'insensitive' } } },
            { uploader: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: {
          uploader: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          _count: { select: { media: true } },
        },
        take: 10,
      })
    }

    res.json({
      query: q,
      results,
      total: {
        events: results.events?.length || 0,
        photos: results.photos?.length || 0,
        users: results.users?.length || 0,
      },
    })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed.' })
  }
})

module.exports = router