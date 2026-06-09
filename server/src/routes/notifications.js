const express = require('express')
const prisma = require('../db') 
const { protect } = require('../middleware/auth')

const router = express.Router()

// GET /api/notifications  — get my notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        actor: { select: { id: true, name: true } },
        media: { select: { id: true, thumbnailUrl: true, url: true } },
      },
    })

    const unreadCount = notifications.filter((n) => !n.isRead).length

    res.json({ notifications, unreadCount })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
})

// PUT /api/notifications/read  — mark all as read
router.put('/read', protect, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, isRead: false },
      data: { isRead: true },
    })
    res.json({ message: 'All notifications marked as read.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read.' })
  }
})

// DELETE /api/notifications/:id  — delete one notification
router.delete('/:id', protect, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, recipientId: req.user.id },
    })
    res.json({ message: 'Notification deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification.' })
  }
})

module.exports = router