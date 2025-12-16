const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * @route   GET /api/jobs/status
 * @desc    Get status of all scheduled jobs
 */
router.get('/status', asyncHandler(async (req, res) => {
  const scheduler = req.app.get('scheduler');

  if (!scheduler) {
    return res.json({
      status: 'success',
      message: 'Job scheduler not initialized'
    });
  }

  const status = scheduler.getJobStatus();

  res.json({
    status: 'success',
    data: status
  });
}));

/**
 * @route   POST /api/jobs/run/:jobName
 * @desc    Manually trigger a specific job
 */
router.post('/run/:jobName', asyncHandler(async (req, res) => {
  const { jobName } = req.params;
  const scheduler = req.app.get('scheduler');

  if (!scheduler) {
    return res.status(503).json({
      status: 'error',
      message: 'Job scheduler not initialized'
    });
  }

  logger.info('API: Manual job trigger requested', { jobName });

  const result = await scheduler.runJobManually(jobName);

  res.json({
    status: 'success',
    message: `Job ${jobName} executed successfully`,
    data: result
  });
}));

module.exports = router;
