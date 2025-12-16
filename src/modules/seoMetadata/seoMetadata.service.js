const OpenAI = require('openai');
const config = require('../../config/config');
const logger = require('../../config/logger');
const { truncateText, extractHashtags } = require('../../utils/helpers');

class SEOMetadataService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  /**
   * Generate comprehensive SEO metadata for video
   */
  async generateSEOMetadata(script, options = {}) {
    try {
      const {
        niche = config.content.contentNiche,
        targetKeywords = [],
        platform = 'youtube'
      } = options;

      logger.info('Generating SEO metadata', { niche, platform });

      const metadata = {
        title: await this.generateTitle(script, niche),
        description: await this.generateDescription(script, niche, targetKeywords),
        tags: await this.generateTags(script, niche),
        hashtags: await this.generateHashtags(script, niche),
        category: await this.suggestCategory(script, niche),
        keywords: targetKeywords.length > 0 ? targetKeywords : await this.extractKeywords(script)
      };

      // Add platform-specific optimizations
      if (platform === 'youtube') {
        metadata.chapters = await this.generateChapters(script);
      }

      logger.info('Successfully generated SEO metadata');

      return metadata;
    } catch (error) {
      logger.error('Failed to generate SEO metadata', {
        error: error.message
      });
      throw new Error(`SEO metadata generation failed: ${error.message}`);
    }
  }

  /**
   * Generate engaging title
   */
  async generateTitle(script, niche) {
    try {
      const prompt = `Create 3 engaging, SEO-optimized YouTube video titles for this ${niche} content:

${truncateText(script, 500)}

Requirements:
- 60 characters or less
- Include keywords naturally
- Create curiosity or promise value
- Capitalize properly

Format: Just list the 3 titles, numbered.`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert specializing in viral titles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      });

      const titles = response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim());

      return titles[0] || 'Untitled Video';
    } catch (error) {
      logger.error('Failed to generate title', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate optimized description
   */
  async generateDescription(script, niche, keywords) {
    try {
      const keywordText = keywords.length > 0 ? `\nTarget keywords: ${keywords.join(', ')}` : '';
      
      const prompt = `Create a YouTube video description for this ${niche} content:

${truncateText(script, 500)}${keywordText}

Include:
- Engaging opening (2-3 sentences)
- Key points covered
- Call to action
- Relevant keywords naturally integrated
- Timestamp suggestions

Keep it under 500 words.`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert creating optimized descriptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Failed to generate description', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate tags
   */
  async generateTags(script, niche) {
    try {
      const prompt = `Generate 15-20 relevant YouTube tags for this ${niche} video:

${truncateText(script, 300)}

Mix of:
- Specific tags (long-tail)
- Broad tags (competitive)
- Trending tags

Format: comma-separated list`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert creating effective tags.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 300
      });

      const tags = response.choices[0].message.content
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      return tags.slice(0, 20);
    } catch (error) {
      logger.error('Failed to generate tags', { error: error.message });
      return [];
    }
  }

  /**
   * Generate hashtags
   */
  async generateHashtags(script, niche) {
    try {
      const prompt = `Generate 5-10 trending hashtags for this ${niche} video content:

${truncateText(script, 200)}

Mix popular and niche-specific hashtags. Format: #hashtag`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert creating effective hashtags.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      let hashtags = extractHashtags(response.choices[0].message.content);
      
      // If no hashtags found, extract words and format them
      if (hashtags.length === 0) {
        hashtags = response.choices[0].message.content
          .split(/[\s,]+/)
          .filter(word => word.length > 0)
          .map(word => word.startsWith('#') ? word : `#${word}`)
          .slice(0, 10);
      }

      return hashtags;
    } catch (error) {
      logger.error('Failed to generate hashtags', { error: error.message });
      return [];
    }
  }

  /**
   * Suggest video category
   */
  async suggestCategory(script, niche) {
    const categoryMap = {
      technology: 'Science & Technology',
      finance: 'Education',
      health: 'Howto & Style',
      entertainment: 'Entertainment',
      education: 'Education',
      gaming: 'Gaming',
      music: 'Music'
    };

    return categoryMap[niche.toLowerCase()] || 'Education';
  }

  /**
   * Extract keywords from script
   */
  async extractKeywords(script) {
    try {
      const prompt = `Extract 5-10 key SEO keywords/phrases from this content:

${truncateText(script, 400)}

Format: comma-separated list of keywords`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert extracting relevant keywords.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 150
      });

      return response.choices[0].message.content
        .split(',')
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0);
    } catch (error) {
      logger.error('Failed to extract keywords', { error: error.message });
      return [];
    }
  }

  /**
   * Generate video chapters/timestamps
   */
  async generateChapters(script) {
    try {
      const prompt = `Create 4-6 video chapter titles with timestamps for this script:

${truncateText(script, 600)}

Format:
0:00 - Introduction
0:15 - [Chapter title]
...

Keep it natural and descriptive.`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a video editor creating chapter timestamps.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 300
      });

      return response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim() && line.includes(':'))
        .map(line => line.trim());
    } catch (error) {
      logger.error('Failed to generate chapters', { error: error.message });
      return [];
    }
  }
}

module.exports = SEOMetadataService;
