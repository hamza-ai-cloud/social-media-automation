const express = require('express');
const router = express.Router();
const ContentOrchestrator = require('../services/contentOrchestrator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const orchestrator = new ContentOrchestrator();

/**
 * @route   POST /api/content/generate
 * @desc    Generate complete content package
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const {
    topic,
    niche,
    duration,
    autoDiscoverTrend = true
  } = req.body;

  logger.info('API: Content generation requested', { topic, niche });

  const content = await orchestrator.generateCompleteContent({
    topic,
    niche,
    duration,
    autoDiscoverTrend
  });

  res.status(201).json({
    status: 'success',
    data: content
  });
}));

/**
 * @route   POST /api/content/repurpose
 * @desc    Repurpose content for different platforms
 */
router.post('/repurpose', asyncHandler(async (req, res) => {
  const { content, platforms } = req.body;

  if (!content || !platforms) {
    throw new AppError('Content and platforms are required', 400);
  }

  logger.info('API: Content repurposing requested', { platforms });

  const repurposed = await orchestrator.repurposeContent(content, platforms);

  res.json({
    status: 'success',
    data: repurposed
  });
}));

/**
 * @route   POST /api/content/publish
 * @desc    Publish content to platforms
 */
router.post('/publish', asyncHandler(async (req, res) => {
  const { content, platforms } = req.body;

  if (!content || !platforms) {
    throw new AppError('Content and platforms are required', 400);
  }

  logger.info('API: Content publishing requested', { platforms });

  const results = await orchestrator.publishContent(content, platforms);

  res.json({
    status: 'success',
    data: results
  });
}));

module.exports = router;
