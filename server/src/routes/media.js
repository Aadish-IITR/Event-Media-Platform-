const express = require('express')
const prisma = require('../db')
const { protect, restrictTo } = require('../middleware/auth')
const { upload, cloudinary } = require('../config/cloudinary')
const { getImageTags } = require('../helpers/aiTagger')

const router = express.Router()


// ─── UPLOAD MEDIA ────────────────────────────────────────────
// POST /api/media/upload
// Accepts: multipart/form-data with field "photos" (up to 10 files) + eventId
router.post(
  '/upload',
  protect,
  restrictTo('ADMIN', 'PHOTOGRAPHER'),
  upload.array('photos', 10),
  async (req, res) => {
    try {
      const { eventId } = req.body

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required.' })
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' })
      }

      // Verify event exists
      const event = await prisma.event.findUnique({ where: { id: eventId } })
      if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
      }

      const savedMedia = []

      for (const file of req.files) {
        const imageUrl = file.path          // Cloudinary secure URL
        const thumbnailUrl = imageUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/')

        // Get AI tags (non-blocking — if it fails, we still save the photo)
        const tags = await getImageTags(imageUrl)

        const media = await prisma.media.create({
          data: {
            url: imageUrl,
            thumbnailUrl,
            type: 'PHOTO',
            tags,
            eventId,
            uploaderId: req.user.id,
          },
          include: {
            uploader: { select: { id: true, name: true } },
          },
        })

        savedMedia.push(media)
      }

      res.status(201).json({
        message: `${savedMedia.length} photo(s) uploaded successfully!`,
        media: savedMedia,
      })
    } catch (err) {
      console.error('Upload error:', err)
      res.status(500).json({ error: 'Upload failed. Please try again.' })
    }
  }
)

// ─── GET ALL MEDIA (with filters) ───────────────────────────
// GET /api/media?eventId=...&tags=...&search=...
router.get('/', async (req, res) => {
  try {
    const { eventId, tag, search, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {}

    if (eventId) where.eventId = eventId

    if (tag) {
      where.tags = { has: tag }
    }

    if (search) {
      where.OR = [
        { tags: { has: search.toLowerCase() } },
        { event: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          uploader: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
        },
      }),
      prisma.media.count({ where }),
    ])

    res.json({
      media,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    console.error('Get media error:', err)
    res.status(500).json({ error: 'Failed to fetch media.' })
  }
})

// ─── GET SINGLE MEDIA ────────────────────────────────────────
// GET /api/media/:id
router.get('/:id', async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: req.params.id },
      include: {
        uploader: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
        likes: { select: { userId: true } },
      },
    })

    if (!media) return res.status(404).json({ error: 'Media not found.' })

    res.json({ media })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media.' })
  }
})

// ─── DELETE MEDIA ────────────────────────────────────────────
// DELETE /api/media/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } })

    if (!media) return res.status(404).json({ error: 'Media not found.' })

    if (media.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this photo.' })
    }

    // Delete from Cloudinary
    try {
      const publicId = media.url.split('/').slice(-1)[0].split('.')[0]
      await cloudinary.uploader.destroy(`event-media-platform/${publicId}`)
    } catch (e) {
      console.error('Cloudinary delete failed:', e.message)
    }

    await prisma.media.delete({ where: { id: req.params.id } })

    res.json({ message: 'Photo deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo.' })
  }
})

// ─── LIKE / UNLIKE ───────────────────────────────────────────
// POST /api/media/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const mediaId = req.params.id
    const userId = req.user.id

    const existing = await prisma.like.findUnique({
      where: { userId_mediaId: { userId, mediaId } },
    })

    if (existing) {
      // Unlike
      await prisma.like.delete({
        where: { userId_mediaId: { userId, mediaId } },
      })
      await prisma.media.update({
        where: { id: mediaId },
        data: { likesCount: { decrement: 1 } },
      })
      return res.json({ liked: false, message: 'Unliked.' })
    } else {
      // Like
      await prisma.like.create({ data: { userId, mediaId } })
      await prisma.media.update({
        where: { id: mediaId },
        data: { likesCount: { increment: 1 } },
      })

      // Create notification for uploader (if not liking own photo)
      const media = await prisma.media.findUnique({ where: { id: mediaId } })
      if (media && media.uploaderId !== userId) {
        await prisma.notification.create({
          data: {
            recipientId: media.uploaderId,
            actorId: userId,
            type: 'LIKE',
            mediaId,
          },
        })
      }

      return res.json({ liked: true, message: 'Liked!' })
    }
  } catch (err) {
    console.error('Like error:', err)
    res.status(500).json({ error: 'Failed to like/unlike.' })
  }
})

// ─── COMMENTS ────────────────────────────────────────────────
// GET /api/media/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { mediaId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    })
    res.json({ comments })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments.' })
  }
})

// POST /api/media/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { body } = req.body
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' })
    }

    const comment = await prisma.comment.create({
      data: {
        body: body.trim(),
        userId: req.user.id,
        mediaId: req.params.id,
      },
      include: { user: { select: { id: true, name: true } } },
    })

    // Notify the uploader
    const media = await prisma.media.findUnique({ where: { id: req.params.id } })
    if (media && media.uploaderId !== req.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: media.uploaderId,
          actorId: req.user.id,
          type: 'COMMENT',
          mediaId: req.params.id,
        },
      })
    }

    res.status(201).json({ comment })
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment.' })
  }
})

// DELETE /api/media/comments/:commentId
router.delete('/comments/:commentId', protect, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
    })
    if (!comment) return res.status(404).json({ error: 'Comment not found.' })
    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized.' })
    }
    await prisma.comment.delete({ where: { id: req.params.commentId } })
    res.json({ message: 'Comment deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment.' })
  }
})

// ─── FAVOURITES ──────────────────────────────────────────────
// POST /api/media/:id/favourite
router.post('/:id/favourite', protect, async (req, res) => {
  try {
    const mediaId = req.params.id
    const userId = req.user.id

    const existing = await prisma.favourite.findUnique({
      where: { userId_mediaId: { userId, mediaId } },
    })

    if (existing) {
      await prisma.favourite.delete({
        where: { userId_mediaId: { userId, mediaId } },
      })
      return res.json({ favourited: false })
    } else {
      await prisma.favourite.create({ data: { userId, mediaId } })
      return res.json({ favourited: true })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favourite.' })
  }
})

// GET /api/media/favourites/mine
router.get('/favourites/mine', protect, async (req, res) => {
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

module.exports = router