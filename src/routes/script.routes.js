const express = require('express');
const router = express.Router();
const ScriptGenerationService = require('../modules/scriptGeneration/scriptGeneration.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const scriptService = new ScriptGenerationService();

/**
 * @route   POST /api/script/generate
 * @desc    Generate video script
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const {
    topic,
    duration = 120,
    tone = 'engaging',
    targetAudience = 'general'
  } = req.body;

  if (!topic) {
    throw new AppError('Topic is required', 400);
  }

  logger.info('API: Script generation requested', { topic, duration });

  const script = await scriptService.generateVideoScript({
    topic,
    duration,
    tone,
    targetAudience
  });

  res.status(201).json({
    status: 'success',
    data: script
  });
}));

/**
 * @route   POST /api/script/voiceover
 * @desc    Generate voiceover-optimized text
 */
router.post('/voiceover', asyncHandler(async (req, res) => {
  const { script } = req.body;

  if (!script) {
    throw new AppError('Script is required', 400);
  }

  logger.info('API: Voiceover text generation requested');

  const voiceoverText = await scriptService.generateVoiceoverText(script);

  res.json({
    status: 'success',
    data: {
      voiceoverText
    }
  });
}));

/**
 * @route   POST /api/script/variations
 * @desc    Generate multiple script variations
 */
router.post('/variations', asyncHandler(async (req, res) => {
  const { topic, count = 3 } = req.body;

  if (!topic) {
    throw new AppError('Topic is required', 400);
  }

  logger.info('API: Script variations requested', { topic, count });

  const variations = await scriptService.generateScriptVariations(topic, count);

  res.json({
    status: 'success',
    count: variations.length,
    data: variations
  });
}));

module.exports = router;
