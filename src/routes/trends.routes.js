const express = require('express');
const router = express.Router();
const TrendDiscoveryService = require('../modules/trendDiscovery/trendDiscovery.service');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const trendService = new TrendDiscoveryService();

/**
 * @route   GET /api/trends/youtube
 * @desc    Get YouTube trending videos
 */
router.get('/youtube', asyncHandler(async (req, res) => {
  const {
    regionCode = 'US',
    maxResults = 20,
    videoCategoryId
  } = req.query;

  logger.info('API: YouTube trends requested', { regionCode, maxResults });

  const trends = await trendService.discoverYouTubeTrends({
    regionCode,
    maxResults: parseInt(maxResults),
    videoCategoryId
  });

  res.json({
    status: 'success',
    count: trends.length,
    data: trends
  });
}));

/**
 * @route   GET /api/trends/search
 * @desc    Search for trending keywords
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { keywords, maxResults = 10, order = 'viewCount' } = req.query;

  if (!keywords) {
    return res.status(400).json({
      status: 'error',
      message: 'Keywords parameter is required'
    });
  }

  logger.info('API: Keyword search requested', { keywords });

  const videos = await trendService.searchTrendingKeywords(keywords, {
    maxResults: parseInt(maxResults),
    order
  });

  res.json({
    status: 'success',
    count: videos.length,
    data: videos
  });
}));

/**
 * @route   GET /api/trends/niche/:niche
 * @desc    Get trending topics for specific niche
 */
router.get('/niche/:niche', asyncHandler(async (req, res) => {
  const { niche } = req.params;

  logger.info('API: Niche trends requested', { niche });

  const topics = await trendService.getTrendingTopicsForNiche(niche);

  res.json({
    status: 'success',
    count: topics.length,
    data: topics
  });
}));

module.exports = router;
