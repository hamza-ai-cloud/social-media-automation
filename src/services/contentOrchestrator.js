const TrendDiscoveryService = require('../modules/trendDiscovery/trendDiscovery.service');
const ScriptGenerationService = require('../modules/scriptGeneration/scriptGeneration.service');
const VoiceoverService = require('../modules/voiceover/voiceover.service');
const VisualGenerationService = require('../modules/visualGeneration/visualGeneration.service');
const SEOMetadataService = require('../modules/seoMetadata/seoMetadata.service');
const PlatformIntegrationService = require('../modules/platformIntegration/platformIntegration.service');
const logger = require('../config/logger');
const config = require('../config/config');
const { generateId } = require('../utils/helpers');
const axios = require('axios');

class ContentOrchestrator {
  constructor() {
    this.trendDiscovery = new TrendDiscoveryService();
    this.scriptGeneration = new ScriptGenerationService();
    this.voiceover = new VoiceoverService();
    this.visualGeneration = new VisualGenerationService();
    this.seoMetadata = new SEOMetadataService();
    this.platformIntegration = new PlatformIntegrationService();
  }

  /**
   * Full content generation pipeline
   */
  async generateCompleteContent(options = {}) {
    const contentId = generateId();
    
    try {
      logger.info('Starting complete content generation', { contentId });

      const {
        topic = null,
        niche = config.content.contentNiche,
        duration = 120,
        autoDiscoverTrend = true,
        platforms = ['youtube']
      } = options;

      let finalTopic = topic;

      // Step 1: Trend Discovery (if no topic provided)
      if (autoDiscoverTrend && !topic) {
        logger.info('Discovering trends', { niche });
        const trends = await this.trendDiscovery.getTrendingTopicsForNiche(niche);
        finalTopic = trends[0]?.title || `Trending ${niche} topic`;
        logger.info('Discovered topic', { topic: finalTopic });
      }

      if (!finalTopic) {
        throw new Error('No topic provided or discovered');
      }

      // Step 2: Script Generation
      logger.info('Generating script', { topic: finalTopic });
      const script = await this.scriptGeneration.generateVideoScript({
        topic: finalTopic,
        duration,
        tone: 'engaging',
        targetAudience: config.content.targetAudience
      });

      // Step 3: Voiceover Generation
      logger.info('Generating voiceover');
      const voiceoverText = await this.scriptGeneration.generateVoiceoverText(
        script.fullScript
      );
      const voiceover = await this.voiceover.generateVoiceover(voiceoverText, {
        filename: `${contentId}_voiceover.mp3`
      });

      // Step 4: Visual Prompts
      logger.info('Generating visual prompts');
      const visuals = await this.visualGeneration.generateVisualPrompts(
        script.fullScript,
        {
          sceneCount: 5,
          style: 'modern'
        }
      );

      // Step 5: Thumbnail Concepts
      logger.info('Generating thumbnail concepts');
      const thumbnails = await this.visualGeneration.generateThumbnailPrompts(
        finalTopic,
        { count: 3 }
      );

      // Step 6: SEO Metadata
      logger.info('Generating SEO metadata');
      const seoMetadata = await this.seoMetadata.generateSEOMetadata(
        script.fullScript,
        { niche }
      );

      // Step 7: B-roll Suggestions
      logger.info('Generating B-roll suggestions');
      const brollSuggestions = await this.visualGeneration.generateBRollSuggestions(
        script.fullScript
      );

      const content = {
        id: contentId,
        topic: finalTopic,
        niche,
        script,
        voiceover,
        visuals,
        thumbnails,
        seoMetadata,
        brollSuggestions,
        metadata: {
          createdAt: new Date().toISOString(),
          duration,
          platforms,
          status: 'generated'
        }
      };

      logger.info('Content generation complete', { contentId });

      // Notify n8n webhook if enabled
      if (config.n8n.enabled && config.n8n.webhookUrl) {
        await this.notifyN8N(content);
      }

      return content;
    } catch (error) {
      logger.error('Content generation failed', {
        contentId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Repurpose content for different platforms
   */
  async repurposeContent(content, targetPlatforms = []) {
    try {
      logger.info('Repurposing content for platforms', {
        contentId: content.id,
        platforms: targetPlatforms
      });

      const repurposed = {};

      for (const platform of targetPlatforms) {
        switch (platform) {
          case 'instagram':
            repurposed.instagram = await this.repurposeForInstagram(content);
            break;
          case 'tiktok':
            repurposed.tiktok = await this.repurposeForTikTok(content);
            break;
          case 'facebook':
            repurposed.facebook = await this.repurposeForFacebook(content);
            break;
          case 'linkedin':
            repurposed.linkedin = await this.repurposeForLinkedIn(content);
            break;
        }
      }

      logger.info('Content repurposing complete', {
        contentId: content.id,
        platforms: Object.keys(repurposed)
      });

      return repurposed;
    } catch (error) {
      logger.error('Content repurposing failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Repurpose for Instagram
   */
  async repurposeForInstagram(content) {
    const description = content.seoMetadata?.description || '';
    const hashtags = content.seoMetadata?.hashtags || [];
    const caption = `${description.split('\n')[0]}\n\n${hashtags.slice(0, 10).join(' ')}`;
    
    return {
      caption: caption.substring(0, 2200),
      hashtags: hashtags.slice(0, 30),
      aspectRatio: '9:16',
      duration: 60, // Instagram Reels max
      visualStyle: 'vertical'
    };
  }

  /**
   * Repurpose for TikTok
   */
  async repurposeForTikTok(content) {
    const caption = content.seoMetadata?.title || content.topic || 'Video';
    
    return {
      caption: caption.substring(0, 150),
      hashtags: (content.seoMetadata?.hashtags || []).slice(0, 10),
      aspectRatio: '9:16',
      duration: 60,
      visualStyle: 'vertical-dynamic'
    };
  }

  /**
   * Repurpose for Facebook
   */
  async repurposeForFacebook(content) {
    const description = content.seoMetadata?.description || content.topic || '';
    const hashtags = content.seoMetadata?.hashtags || [];
    
    return {
      message: description.substring(0, 5000),
      hashtags: hashtags.slice(0, 15),
      visualStyle: 'square'
    };
  }

  /**
   * Repurpose for LinkedIn
   */
  async repurposeForLinkedIn(content) {
    const title = content.seoMetadata?.title || content.topic || 'Professional Content';
    const description = content.seoMetadata?.description || '';
    const descriptionLines = description.split('\n').slice(0, 3).join('\n');
    const professionalTone = `${title}\n\n${descriptionLines}`;
    const hashtags = content.seoMetadata?.hashtags || [];
    
    return {
      text: professionalTone.substring(0, 3000),
      hashtags: hashtags.slice(0, 5),
      visualStyle: 'professional'
    };
  }

  /**
   * Publish content to platforms
   */
  async publishContent(content, platforms = []) {
    try {
      logger.info('Publishing content to platforms', {
        contentId: content.id,
        platforms
      });

      const repurposed = await this.repurposeContent(content, platforms);
      const results = [];

      for (const platform of platforms) {
        const platformContent = repurposed[platform];
        if (!platformContent) continue;

        let result;
        switch (platform) {
          case 'instagram':
            result = await this.platformIntegration.postToInstagram(content, {
              caption: platformContent.caption,
              hashtags: platformContent.hashtags
            });
            break;
          case 'tiktok':
            result = await this.platformIntegration.postToTikTok(content, {
              caption: platformContent.caption,
              hashtags: platformContent.hashtags
            });
            break;
          case 'facebook':
            result = await this.platformIntegration.postToFacebook(content, {
              message: platformContent.message,
              hashtags: platformContent.hashtags
            });
            break;
          case 'linkedin':
            result = await this.platformIntegration.postToLinkedIn(content, {
              text: platformContent.text,
              hashtags: platformContent.hashtags
            });
            break;
        }
        
        if (result) {
          results.push(result);
        }
      }

      logger.info('Content publishing complete', {
        contentId: content.id,
        results
      });

      return results;
    } catch (error) {
      logger.error('Content publishing failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Notify n8n webhook
   */
  async notifyN8N(content) {
    try {
      logger.info('Notifying n8n webhook', { contentId: content.id });

      await axios.post(config.n8n.webhookUrl, {
        event: 'content-ready',
        content: {
          id: content.id,
          topic: content.topic,
          niche: content.niche,
          title: content.seoMetadata?.title || content.topic || 'Untitled',
          description: content.seoMetadata?.description || '',
          voiceover: content.voiceover,
          createdAt: content.metadata.createdAt
        }
      });

      logger.info('n8n webhook notified successfully');
    } catch (error) {
      logger.error('Failed to notify n8n webhook', {
        error: error.message
      });
      // Don't throw - this is non-critical
    }
  }
}

module.exports = ContentOrchestrator;
