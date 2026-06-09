const express = require('express')
const prisma = require('../db');
const { protect } = require('../middleware/auth')
const axios = require('axios')
const sharp = require('sharp')

const router = express.Router()

// GET /api/download/:mediaId
// Downloads the photo with a dynamic watermark burned in
router.get('/:mediaId', protect, async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: req.params.mediaId },
      include: {
        event: { select: { name: true } },
      },
    })

    if (!media) {
      return res.status(404).json({ error: 'Photo not found.' })
    }

    // Fetch the image from Cloudinary as a buffer
    const imageResponse = await axios.get(media.url, {
      responseType: 'arraybuffer',
      timeout: 15000,
    })
    const imageBuffer = Buffer.from(imageResponse.data)

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const { width = 800, height = 600 } = metadata

    // Build watermark text
    const clubName = 'EventMedia Club'
    const eventName = media.event?.name || 'Event'
    const watermarkText = `${clubName} · ${eventName}`

    // Font size scales with image width
    const fontSize = Math.max(16, Math.floor(width / 30))
    const padding = 16

    // Create SVG watermark overlay
    // Create SVG watermark overlay
    const svgWatermark = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .watermark {
              font-family: Arial, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: white;
              opacity: 0.75;
            }
            .watermark-shadow {
              font-family: Arial, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: black;
              opacity: 0.5;
            }
          </style>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0"/>
            <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
          </linearGradient>
        </defs>

        <rect
          x="0"
          y="${height - fontSize * 2.5}"
          width="${width}"
          height="${fontSize * 2.5}"
          fill="url(#grad)"
        />

        <text
          class="watermark-shadow"
          x="${padding + 1}"
          y="${height - padding + 1}"
        >${watermarkText}</text>

        <text
          class="watermark"
          x="${padding}"
          y="${height - padding}"
        >${watermarkText}</text>
      </svg>
    `)

    // Composite the watermark onto the image
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{ input: svgWatermark, top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer()

    // Send as downloadable file
    const filename = `${eventName.replace(/[^a-z0-9]/gi, '_')}_photo.jpg`
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': watermarkedBuffer.length,
    })

    res.send(watermarkedBuffer)

  } catch (err) {
    console.error('Download/watermark error:', err)
    res.status(500).json({ error: 'Failed to process download.' })
  }
})

module.exports = router