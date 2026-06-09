const axios = require('axios')

/**
 * Given a public image URL, returns an array of tag strings
 * using Imagga's free API. If tagging fails, returns [].
 * Non-blocking — upload always succeeds even if this fails.
 */
const getImageTags = async (imageUrl) => {
  try {
    const apiKey = process.env.IMAGGA_API_KEY
    const apiSecret = process.env.IMAGGA_API_SECRET

    if (!apiKey || !apiSecret) {
      console.warn('Imagga keys not set — skipping AI tagging')
      return []
    }

    const encodedUrl = encodeURIComponent(imageUrl)
    const response = await axios.get(
      `https://api.imagga.com/v2/tags?image_url=${encodedUrl}&limit=8&threshold=30`,
      {
        auth: {
          username: apiKey,
          password: apiSecret,
        },
        timeout: 10000, // 10 second timeout
      }
    )

    const tags = response.data?.result?.tags || []
    return tags
      .filter((t) => t.confidence > 30)
      .map((t) => t.tag.en.toLowerCase())
      .filter(Boolean)

  } catch (err) {
    // Non-blocking: just log and return empty
    console.error('AI tagging failed (non-blocking):', err.message)
    return []
  }
}

module.exports = { getImageTags }