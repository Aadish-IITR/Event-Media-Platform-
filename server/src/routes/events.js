const express = require('express')
// const { PrismaClient } = require('@prisma/client')
const { protect, restrictTo } = require('../middleware/auth')
const prisma = require('../db')
const router = express.Router()
// const prisma = new PrismaClient()

// ─── GET ALL EVENTS ──────────────────────────────────────────
// GET /api/events
// Public events visible to all. Private events only to logged-in users.
router.get('/', async (req, res) => {
  try {
    const { sort = 'date', category, search } = req.query

    // Build filter
    const where = {}

    // If not logged in, only show public events
    const authHeader = req.headers.authorization
    if (!authHeader) {
      where.isPublic = true
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Build sort
    let orderBy = {}
    if (sort === 'name') orderBy = { name: 'asc' }
    else if (sort === 'category') orderBy = { category: 'asc' }
    else orderBy = { date: 'desc' }

    const events = await prisma.event.findMany({
      where,
      orderBy,
      include: {
        createdBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: {
          select: { media: true },
        },
      },
    })

    res.json({ events })
  } catch (err) {
    console.error('Get events error:', err)
    res.status(500).json({ error: 'Failed to fetch events.' })
  }
})

// ─── GET SINGLE EVENT ────────────────────────────────────────
// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
        media: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { media: true },
        },
      },
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' })
    }

    // Block non-logged-in users from private events
    const authHeader = req.headers.authorization
    if (!event.isPublic && !authHeader) {
      return res.status(403).json({ error: 'This event is private. Please log in.' })
    }

    res.json({ event })
  } catch (err) {
    console.error('Get event error:', err)
    res.status(500).json({ error: 'Failed to fetch event.' })
  }
})

// ─── CREATE EVENT ────────────────────────────────────────────
// POST /api/events  (Admin or Photographer only)
router.post('/', protect, restrictTo('ADMIN', 'PHOTOGRAPHER'), async (req, res) => {
  try {
    const { name, description, category, date, isPublic } = req.body

    if (!name || !date) {
      return res.status(400).json({ error: 'Event name and date are required.' })
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || '',
        category: category || 'General',
        date: new Date(date),
        isPublic: isPublic !== undefined ? isPublic : true,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    res.status(201).json({ message: 'Event created!', event })
  } catch (err) {
    console.error('Create event error:', err)
    res.status(500).json({ error: 'Failed to create event.' })
  }
})

// ─── UPDATE EVENT ────────────────────────────────────────────
// PUT /api/events/:id  (Admin or the creator)
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' })
    }

    // Only creator or Admin can update
    if (event.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this event.' })
    }

    const { name, description, category, date, isPublic } = req.body

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        name: name || event.name,
        description: description !== undefined ? description : event.description,
        category: category || event.category,
        date: date ? new Date(date) : event.date,
        isPublic: isPublic !== undefined ? isPublic : event.isPublic,
      },
    })

    res.json({ message: 'Event updated!', event: updated })
  } catch (err) {
    console.error('Update event error:', err)
    res.status(500).json({ error: 'Failed to update event.' })
  }
})

// ─── DELETE EVENT ────────────────────────────────────────────
// DELETE /api/events/:id  (Admin only)
router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' })
    }

    await prisma.event.delete({ where: { id: req.params.id } })

    res.json({ message: 'Event deleted successfully.' })
  } catch (err) {
    console.error('Delete event error:', err)
    res.status(500).json({ error: 'Failed to delete event.' })
  }
})

module.exports = router