const cron = require('node-cron');
const logger = require('../config/logger');
const config = require('../config/config');
const ContentOrchestrator = require('../services/contentOrchestrator');

class JobScheduler {
  constructor() {
    this.orchestrator = new ContentOrchestrator();
    this.jobs = new Map();
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    logger.info('Starting all scheduled jobs');

    // Trend discovery job
    this.scheduleTrendDiscovery();

    // Content generation job
    this.scheduleContentGeneration();

    // Content posting job
    this.scheduleContentPosting();

    logger.info('All scheduled jobs started', {
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    logger.info('Stopping all scheduled jobs');

    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info('Stopped job', { name });
    }

    this.jobs.clear();
  }

  /**
   * Schedule trend discovery job
   */
  scheduleTrendDiscovery() {
    const schedule = config.cron.trendDiscovery;

    if (!cron.validate(schedule)) {
      logger.error('Invalid trend discovery cron schedule', { schedule });
      return;
    }

    const job = cron.schedule(schedule, async () => {
      try {
        logger.info('Running scheduled trend discovery job');

        const trends = await this.orchestrator.trendDiscovery.getTrendingTopicsForNiche(
          config.content.contentNiche
        );

        logger.info('Trend discovery job complete', {
          trendCount: trends.length,
          topTrend: trends[0]?.title
        });

        // Store trends for later use (in production, save to database)
        this.latestTrends = trends;
      } catch (error) {
        logger.error('Trend discovery job failed', {
          error: error.message,
          stack: error.stack
        });
      }
    });

    this.jobs.set('trendDiscovery', job);
    logger.info('Scheduled trend discovery job', { schedule });
  }

  /**
   * Schedule content generation job
   */
  scheduleContentGeneration() {
    const schedule = config.cron.contentGeneration;

    if (!cron.validate(schedule)) {
      logger.error('Invalid content generation cron schedule', { schedule });
      return;
    }

    const job = cron.schedule(schedule, async () => {
      try {
        logger.info('Running scheduled content generation job');

        const content = await this.orchestrator.generateCompleteContent({
          niche: config.content.contentNiche,
          duration: config.content.minVideoDuration,
          autoDiscoverTrend: true
        });

        logger.info('Content generation job complete', {
          contentId: content.id,
          topic: content.topic
        });

        // Store content for later use (in production, save to database)
        this.generatedContent = this.generatedContent || [];
        this.generatedContent.push(content);

        // Keep only last 10 generated contents in memory
        if (this.generatedContent.length > 10) {
          this.generatedContent.shift();
        }
      } catch (error) {
        logger.error('Content generation job failed', {
          error: error.message,
          stack: error.stack
        });
      }
    });

    this.jobs.set('contentGeneration', job);
    logger.info('Scheduled content generation job', { schedule });
  }

  /**
   * Schedule content posting job
   */
  scheduleContentPosting() {
    const schedule = config.cron.posting;

    if (!cron.validate(schedule)) {
      logger.error('Invalid posting cron schedule', { schedule });
      return;
    }

    const job = cron.schedule(schedule, async () => {
      try {
        logger.info('Running scheduled content posting job');

        // Get the latest generated content
        const content = this.generatedContent?.[this.generatedContent.length - 1];

        if (!content) {
          logger.warn('No content available for posting');
          return;
        }

        // Determine platforms to post to
        const platforms = ['instagram', 'facebook', 'linkedin', 'tiktok'].filter(
          platform => config.socialMedia[platform]?.accessToken
        );

        if (platforms.length === 0) {
          logger.warn('No platforms configured for posting');
          return;
        }

        const results = await this.orchestrator.publishContent(content, platforms);

        logger.info('Content posting job complete', {
          contentId: content.id,
          platforms,
          results
        });
      } catch (error) {
        logger.error('Content posting job failed', {
          error: error.message,
          stack: error.stack
        });
      }
    });

    this.jobs.set('contentPosting', job);
    logger.info('Scheduled content posting job', { schedule });
  }

  /**
   * Run a specific job manually
   */
  async runJobManually(jobName) {
    logger.info('Running job manually', { jobName });

    switch (jobName) {
      case 'trendDiscovery':
        await this.orchestrator.trendDiscovery.getTrendingTopicsForNiche(
          config.content.contentNiche
        );
        break;
      case 'contentGeneration':
        return await this.orchestrator.generateCompleteContent({
          niche: config.content.contentNiche,
          autoDiscoverTrend: true
        });
      case 'contentPosting': {
        const content = this.generatedContent?.[this.generatedContent.length - 1];
        if (content) {
          return await this.orchestrator.publishContent(content, ['instagram']);
        }
        break;
      }
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Get job status
   */
  getJobStatus() {
    const status = {};

    for (const [name] of this.jobs) {
      status[name] = {
        running: true,
        schedule: this.getScheduleForJob(name)
      };
    }

    return status;
  }

  /**
   * Get schedule for specific job
   */
  getScheduleForJob(jobName) {
    const schedules = {
      trendDiscovery: config.cron.trendDiscovery,
      contentGeneration: config.cron.contentGeneration,
      contentPosting: config.cron.posting
    };

    return schedules[jobName] || 'unknown';
  }
}

module.exports = JobScheduler;
