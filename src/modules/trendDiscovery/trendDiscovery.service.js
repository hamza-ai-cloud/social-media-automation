const { google } = require('googleapis');
const config = require('../../config/config');
const logger = require('../../config/logger');
const { makeRequest } = require('../../utils/helpers');

class TrendDiscoveryService {
  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: config.youtube.apiKey
    });
  }

  /**
   * Discover trending topics on YouTube
   */
  async discoverYouTubeTrends(options = {}) {
    try {
      const {
        regionCode = 'US',
        maxResults = 20,
        videoCategoryId = null
      } = options;

      logger.info('Discovering YouTube trends', { regionCode, maxResults });

      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        chart: 'mostPopular',
        regionCode,
        maxResults,
        videoCategoryId
      });

      const trends = response.data.items.map(item => ({
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount),
        likeCount: parseInt(item.statistics.likeCount),
        commentCount: parseInt(item.statistics.commentCount),
        duration: item.contentDetails.duration,
        tags: item.snippet.tags || [],
        categoryId: item.snippet.categoryId
      }));

      logger.info('Successfully discovered YouTube trends', {
        count: trends.length
      });

      return trends;
    } catch (error) {
      logger.error('Failed to discover YouTube trends', {
        error: error.message
      });
      throw new Error(`YouTube trend discovery failed: ${error.message}`);
    }
  }

  /**
   * Search for trending keywords
   */
  async searchTrendingKeywords(keywords, options = {}) {
    try {
      const {
        maxResults = 10,
        order = 'viewCount',
        publishedAfter = null
      } = options;

      logger.info('Searching trending keywords', { keywords });

      const searchParams = {
        part: ['snippet'],
        q: keywords,
        type: ['video'],
        maxResults,
        order
      };

      if (publishedAfter) {
        searchParams.publishedAfter = publishedAfter;
      }

      const response = await this.youtube.search.list(searchParams);

      const videos = response.data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails
      }));

      logger.info('Successfully searched trending keywords', {
        count: videos.length
      });

      return videos;
    } catch (error) {
      logger.error('Failed to search trending keywords', {
        error: error.message
      });
      throw new Error(`Keyword search failed: ${error.message}`);
    }
  }

  /**
   * Analyze trend metrics and identify best opportunities
   */
  analyzeTrends(trends) {
    logger.info('Analyzing trends for opportunities');

    const analyzed = trends.map(trend => {
      const engagementRate = (
        (trend.likeCount + trend.commentCount) / trend.viewCount * 100
      ).toFixed(2);

      const score = this.calculateTrendScore(trend);

      return {
        ...trend,
        engagementRate: parseFloat(engagementRate),
        trendScore: score
      };
    });

    // Sort by trend score
    analyzed.sort((a, b) => b.trendScore - a.trendScore);

    logger.info('Trend analysis complete', {
      topScore: analyzed[0]?.trendScore
    });

    return analyzed;
  }

  /**
   * Calculate trend score based on multiple factors
   */
  calculateTrendScore(trend) {
    const weights = {
      viewCount: 0.3,
      engagement: 0.4,
      recency: 0.3
    };

    // Normalize view count (log scale)
    const viewScore = Math.log10(trend.viewCount) / 10;

    // Engagement score
    const engagementScore = (
      (trend.likeCount + trend.commentCount) / trend.viewCount
    );

    // Recency score (newer is better)
    const publishedDate = new Date(trend.publishedAt);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSincePublished / 30));

    // Calculate weighted score
    const score = (
      viewScore * weights.viewCount +
      engagementScore * weights.engagement +
      recencyScore * weights.recency
    ) * 100;

    return parseFloat(score.toFixed(2));
  }

  /**
   * Get trending topics for specific niche
   */
  async getTrendingTopicsForNiche(niche) {
    try {
      logger.info('Getting trending topics for niche', { niche });

      const keywords = await this.getNicheKeywords(niche);
      const trends = await this.searchTrendingKeywords(keywords.join(' '), {
        maxResults: 15,
        order: 'viewCount'
      });

      const analyzed = this.analyzeTrends(
        trends.map(t => ({
          ...t,
          viewCount: 100000, // Placeholder for search results
          likeCount: 5000,
          commentCount: 500
        }))
      );

      return analyzed.slice(0, 10);
    } catch (error) {
      logger.error('Failed to get trending topics for niche', {
        error: error.message,
        niche
      });
      throw error;
    }
  }

  /**
   * Get relevant keywords for a niche
   */
  getNicheKeywords(niche) {
    const nicheKeywords = {
      technology: ['tech', 'AI', 'software', 'gadgets', 'programming'],
      finance: ['money', 'investing', 'crypto', 'stocks', 'business'],
      health: ['fitness', 'nutrition', 'wellness', 'workout', 'health'],
      entertainment: ['movies', 'music', 'gaming', 'streaming', 'entertainment'],
      education: ['learning', 'tutorial', 'course', 'education', 'skills']
    };

    return nicheKeywords[niche.toLowerCase()] || ['trending', 'viral', 'popular'];
  }
}

module.exports = TrendDiscoveryService;
