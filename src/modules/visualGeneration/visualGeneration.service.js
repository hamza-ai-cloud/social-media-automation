const OpenAI = require('openai');
const config = require('../../config/config');
const logger = require('../../config/logger');

class VisualGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  /**
   * Generate faceless visual prompts for video scenes
   */
  async generateVisualPrompts(script, options = {}) {
    try {
      const {
        style = 'modern',
        sceneCount = 5,
        aspectRatio = '16:9'
      } = options;

      logger.info('Generating visual prompts', { sceneCount, style });

      const prompt = this.buildVisualPromptRequest(script, style, sceneCount, aspectRatio);

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed visual prompts for faceless video content, including stock footage suggestions, animations, and text overlays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const visualPromptsText = response.choices[0].message.content;
      const visualPrompts = this.parseVisualPrompts(visualPromptsText);

      logger.info('Successfully generated visual prompts', {
        count: visualPrompts.length
      });

      return {
        prompts: visualPrompts,
        style,
        aspectRatio,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: config.openai.model
        }
      };
    } catch (error) {
      logger.error('Failed to generate visual prompts', {
        error: error.message
      });
      throw new Error(`Visual prompt generation failed: ${error.message}`);
    }
  }

  /**
   * Build visual prompt request
   */
  buildVisualPromptRequest(script, style, sceneCount, aspectRatio) {
    return `Generate ${sceneCount} detailed visual scene descriptions for a faceless YouTube video based on this script:

${script}

Requirements:
- Style: ${style}
- Aspect ratio: ${aspectRatio}
- Each scene should describe:
  1. Visual elements (stock footage, graphics, animations)
  2. Text overlays and their positioning
  3. Color scheme and mood
  4. Transitions and effects
  5. Duration suggestion

Format each scene as:
SCENE [number]:
Visual: [description]
Text Overlay: [text and position]
Duration: [seconds]
Notes: [additional details]

Make it suitable for faceless content - no people on camera, focus on visuals, text, and graphics.`;
  }

  /**
   * Parse visual prompts from AI response
   */
  parseVisualPrompts(visualPromptsText) {
    const scenes = [];
    const sceneBlocks = visualPromptsText.split(/SCENE \d+:/i).filter(Boolean);

    for (const block of sceneBlocks) {
      const lines = block.trim().split('\n');
      const scene = {
        visual: '',
        textOverlay: '',
        duration: 10,
        notes: '',
        colorScheme: '',
        transition: ''
      };

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.startsWith('visual:')) {
          scene.visual = line.replace(/^visual:\s*/i, '').trim();
        } else if (lowerLine.startsWith('text overlay:')) {
          scene.textOverlay = line.replace(/^text overlay:\s*/i, '').trim();
        } else if (lowerLine.startsWith('duration:')) {
          const durationMatch = line.match(/(\d+)/);
          if (durationMatch) {
            scene.duration = parseInt(durationMatch[1], 10);
          }
        } else if (lowerLine.startsWith('notes:')) {
          scene.notes = line.replace(/^notes:\s*/i, '').trim();
        } else if (lowerLine.startsWith('color')) {
          scene.colorScheme = line.replace(/^color.*?:\s*/i, '').trim();
        } else if (lowerLine.startsWith('transition')) {
          scene.transition = line.replace(/^transition.*?:\s*/i, '').trim();
        }
      }

      if (scene.visual) {
        scenes.push(scene);
      }
    }

    return scenes;
  }

  /**
   * Generate thumbnail prompts
   */
  async generateThumbnailPrompts(title, options = {}) {
    try {
      const {
        count = 3,
        style = 'eye-catching'
      } = options;

      logger.info('Generating thumbnail prompts', { title, count });

      const prompt = `Create ${count} compelling YouTube thumbnail concepts for a video titled: "${title}"

For each thumbnail, describe:
1. Main visual element
2. Text to include
3. Color scheme
4. Emotional appeal
5. Why it will get clicks

Make them ${style} and optimized for YouTube's algorithm.`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating high-CTR YouTube thumbnail concepts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      logger.info('Successfully generated thumbnail prompts');

      return {
        thumbnailConcepts: response.choices[0].message.content,
        title,
        count
      };
    } catch (error) {
      logger.error('Failed to generate thumbnail prompts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate B-roll suggestions
   */
  async generateBRollSuggestions(script) {
    try {
      logger.info('Generating B-roll suggestions');

      const prompt = `Based on this video script, suggest specific B-roll footage to enhance the video:

${script}

List 10-15 specific stock footage search terms or visual elements that would work well. Format as a simple list.`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert video editor suggesting B-roll footage.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 500
      });

      const suggestions = response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*\d.]\s*/, '').trim());

      logger.info('Successfully generated B-roll suggestions', {
        count: suggestions.length
      });

      return suggestions;
    } catch (error) {
      logger.error('Failed to generate B-roll suggestions', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = VisualGenerationService;
