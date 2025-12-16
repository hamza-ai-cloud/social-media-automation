const axios = require('axios');
const config = require('../../config/config');
const logger = require('../../config/logger');
const { truncateText } = require('../../utils/helpers');

class PlatformIntegrationService {
  /**
   * Post content to Instagram
   */
  async postToInstagram(content, options = {}) {
    try {
      const {
        mediaUrl,
        caption,
        hashtags = []
      } = options;

      if (!config.socialMedia.instagram.accessToken) {
        throw new Error('Instagram access token not configured');
      }

      logger.info('Posting to Instagram', { caption: truncateText(caption, 50) });

      const fullCaption = `${caption}\n\n${hashtags.join(' ')}`;

      // For Instagram, we need to use the Graph API
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${config.socialMedia.instagram.businessAccountId}/media`,
        {
          image_url: mediaUrl,
          caption: truncateText(fullCaption, 2200),
          access_token: config.socialMedia.instagram.accessToken
        }
      );

      const creationId = response.data.id;

      // Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${config.socialMedia.instagram.businessAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: config.socialMedia.instagram.accessToken
        }
      );

      logger.info('Successfully posted to Instagram', {
        postId: publishResponse.data.id
      });

      return {
        platform: 'instagram',
        postId: publishResponse.data.id,
        url: `https://www.instagram.com/p/${publishResponse.data.id}/`,
        success: true
      };
    } catch (error) {
      logger.error('Failed to post to Instagram', {
        error: error.message
      });
      return {
        platform: 'instagram',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post content to TikTok
   */
  async postToTikTok(content, options = {}) {
    try {
      const {
        videoUrl,
        caption,
        hashtags = []
      } = options;

      if (!config.socialMedia.tiktok.accessToken) {
        throw new Error('TikTok access token not configured');
      }

      logger.info('Posting to TikTok', { caption: truncateText(caption, 50) });

      const fullCaption = `${caption} ${hashtags.join(' ')}`;

      // TikTok Content Posting API
      const response = await axios.post(
        'https://open-api.tiktok.com/share/video/upload/',
        {
          video: {
            url: videoUrl
          },
          post_info: {
            title: truncateText(fullCaption, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.socialMedia.tiktok.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Successfully posted to TikTok', {
        shareId: response.data.data.share_id
      });

      return {
        platform: 'tiktok',
        postId: response.data.data.share_id,
        success: true
      };
    } catch (error) {
      logger.error('Failed to post to TikTok', {
        error: error.message
      });
      return {
        platform: 'tiktok',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post content to Facebook
   */
  async postToFacebook(content, options = {}) {
    try {
      const {
        message,
        mediaUrl = null,
        hashtags = []
      } = options;

      if (!config.socialMedia.facebook.accessToken) {
        throw new Error('Facebook access token not configured');
      }

      logger.info('Posting to Facebook', { message: truncateText(message, 50) });

      const fullMessage = `${message}\n\n${hashtags.join(' ')}`;

      let endpoint = `https://graph.facebook.com/v18.0/${config.socialMedia.facebook.pageId}/feed`;
      const postData = {
        message: fullMessage,
        access_token: config.socialMedia.facebook.accessToken
      };

      if (mediaUrl) {
        endpoint = `https://graph.facebook.com/v18.0/${config.socialMedia.facebook.pageId}/photos`;
        postData.url = mediaUrl;
        postData.caption = fullMessage;
      }

      const response = await axios.post(endpoint, postData);

      logger.info('Successfully posted to Facebook', {
        postId: response.data.id
      });

      return {
        platform: 'facebook',
        postId: response.data.id,
        url: `https://www.facebook.com/${response.data.id}`,
        success: true
      };
    } catch (error) {
      logger.error('Failed to post to Facebook', {
        error: error.message
      });
      return {
        platform: 'facebook',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post content to LinkedIn
   */
  async postToLinkedIn(content, options = {}) {
    try {
      const {
        text,
        mediaUrl = null,
        hashtags = []
      } = options;

      if (!config.socialMedia.linkedin.accessToken) {
        throw new Error('LinkedIn access token not configured');
      }

      logger.info('Posting to LinkedIn', { text: truncateText(text, 50) });

      const fullText = `${text}\n\n${hashtags.join(' ')}`;

      const postData = {
        author: config.socialMedia.linkedin.personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: truncateText(fullText, 3000)
            },
            shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      if (mediaUrl) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          originalUrl: mediaUrl
        }];
      }

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${config.socialMedia.linkedin.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      logger.info('Successfully posted to LinkedIn', {
        postId: response.data.id
      });

      return {
        platform: 'linkedin',
        postId: response.data.id,
        success: true
      };
    } catch (error) {
      logger.error('Failed to post to LinkedIn', {
        error: error.message
      });
      return {
        platform: 'linkedin',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post to all platforms
   */
  async postToAllPlatforms(content, platformOptions = {}) {
    logger.info('Posting to all platforms');

    const results = await Promise.allSettled([
      this.postToInstagram(content, platformOptions.instagram || {}),
      this.postToTikTok(content, platformOptions.tiktok || {}),
      this.postToFacebook(content, platformOptions.facebook || {}),
      this.postToLinkedIn(content, platformOptions.linkedin || {})
    ]);

    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    };

    logger.info('Multi-platform posting complete', summary);

    return summary;
  }
}

module.exports = PlatformIntegrationService;
