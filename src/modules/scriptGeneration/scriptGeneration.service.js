const OpenAI = require('openai');
const config = require('../../config/config');
const logger = require('../../config/logger');

class ScriptGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  /**
   * Generate high-retention video script
   */
  async generateVideoScript(options = {}) {
    try {
      const {
        topic,
        duration = 120,
        tone = 'engaging',
        targetAudience = 'general',
        includeHook = true,
        includeCallToAction = true
      } = options;

      logger.info('Generating video script', { topic, duration });

      const prompt = this.buildScriptPrompt(
        topic,
        duration,
        tone,
        targetAudience,
        includeHook,
        includeCallToAction
      );

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert YouTube script writer specializing in high-retention, engaging content for faceless videos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const scriptContent = response.choices[0].message.content;
      const script = this.parseScript(scriptContent);

      logger.info('Successfully generated video script', {
        wordCount: script.fullScript.split(' ').length
      });

      return {
        topic,
        duration,
        ...script,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: config.openai.model,
          tokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      logger.error('Failed to generate video script', {
        error: error.message
      });
      throw new Error(`Script generation failed: ${error.message}`);
    }
  }

  /**
   * Build script generation prompt
   */
  buildScriptPrompt(topic, duration, tone, targetAudience, includeHook, includeCallToAction) {
    const wordCount = Math.floor(duration * 2.5); // ~150 words per minute

    let prompt = `Create a compelling ${duration}-second YouTube video script about: ${topic}\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- Target word count: ~${wordCount} words\n`;
    prompt += `- Tone: ${tone}\n`;
    prompt += `- Target audience: ${targetAudience}\n`;
    prompt += `- High retention: Use pattern interrupts, questions, and engaging transitions\n`;
    
    if (includeHook) {
      prompt += `- Start with a powerful hook in the first 3 seconds\n`;
    }
    
    if (includeCallToAction) {
      prompt += `- End with a clear call-to-action\n`;
    }

    prompt += `\nFormat the script with:\n`;
    prompt += `1. HOOK: Opening line\n`;
    prompt += `2. MAIN CONTENT: Core message broken into engaging segments\n`;
    prompt += `3. CALL TO ACTION: Closing statement\n`;
    prompt += `\nMake it perfect for voiceover - conversational, clear, and engaging.`;

    return prompt;
  }

  /**
   * Parse generated script into structured format
   */
  parseScript(scriptContent) {
    const lines = scriptContent.split('\n').filter(line => line.trim());
    
    const script = {
      hook: '',
      mainContent: [],
      callToAction: '',
      fullScript: scriptContent
    };

    let currentSection = 'main';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('hook:') || lowerLine.startsWith('1.')) {
        currentSection = 'hook';
        script.hook = line.replace(/^.*?hook:\s*/i, '').replace(/^1\.\s*/, '').trim();
      } else if (lowerLine.includes('main content:') || lowerLine.startsWith('2.')) {
        currentSection = 'main';
      } else if (lowerLine.includes('call to action:') || lowerLine.startsWith('3.')) {
        currentSection = 'cta';
        script.callToAction = line.replace(/^.*?call to action:\s*/i, '').replace(/^3\.\s*/, '').trim();
      } else if (line.trim()) {
        if (currentSection === 'main' && !line.match(/^[12]\./) && !lowerLine.includes('content:')) {
          script.mainContent.push(line.trim());
        } else if (currentSection === 'hook' && !script.hook) {
          script.hook = line.trim();
        } else if (currentSection === 'cta' && !script.callToAction) {
          script.callToAction = line.trim();
        }
      }
    }

    return script;
  }

  /**
   * Generate voiceover-optimized text
   */
  async generateVoiceoverText(script) {
    try {
      logger.info('Generating voiceover-optimized text');

      const prompt = `Convert this script into voiceover-ready text with proper pauses and emphasis:\n\n${script}\n\nAdd [PAUSE] where natural breaks should occur, and use CAPS for emphasis. Keep it natural and conversational.`;

      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at preparing scripts for text-to-speech voiceover.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      });

      const voiceoverText = response.choices[0].message.content;

      logger.info('Successfully generated voiceover text');

      return voiceoverText;
    } catch (error) {
      logger.error('Failed to generate voiceover text', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate multiple script variations
   */
  async generateScriptVariations(topic, count = 3) {
    try {
      logger.info('Generating script variations', { topic, count });

      const variations = [];
      const tones = ['engaging', 'educational', 'entertaining', 'inspiring', 'conversational'];

      for (let i = 0; i < count; i++) {
        const script = await this.generateVideoScript({
          topic,
          tone: tones[i % tones.length],
          duration: 120
        });
        variations.push(script);
      }

      logger.info('Successfully generated script variations', {
        count: variations.length
      });

      return variations;
    } catch (error) {
      logger.error('Failed to generate script variations', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = ScriptGenerationService;
