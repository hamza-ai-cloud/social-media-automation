const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');
const config = require('../../config/config');
const logger = require('../../config/logger');
const { sanitizeFilename } = require('../../utils/helpers');

class VoiceoverService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.outputDir = path.join(process.cwd(), 'output', 'audio');
  }

  /**
   * Initialize output directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      logger.info('Voiceover output directory initialized', {
        path: this.outputDir
      });
    } catch (error) {
      logger.error('Failed to initialize voiceover directory', {
        error: error.message
      });
    }
  }

  /**
   * Generate voiceover using OpenAI TTS
   */
  async generateVoiceoverOpenAI(text, options = {}) {
    try {
      const {
        voice = 'alloy',
        model = 'tts-1',
        speed = 1.0,
        filename = null
      } = options;

      logger.info('Generating voiceover with OpenAI', {
        textLength: text.length,
        voice
      });

      await this.initialize();

      const mp3 = await this.openai.audio.speech.create({
        model,
        voice,
        input: text,
        speed
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      const outputFilename = filename || `voiceover_${Date.now()}.mp3`;
      const outputPath = path.join(this.outputDir, sanitizeFilename(outputFilename));

      await fs.writeFile(outputPath, buffer);

      logger.info('Successfully generated voiceover', {
        path: outputPath,
        size: buffer.length
      });

      return {
        path: outputPath,
        filename: outputFilename,
        size: buffer.length,
        provider: 'openai',
        voice,
        model
      };
    } catch (error) {
      logger.error('Failed to generate voiceover with OpenAI', {
        error: error.message
      });
      throw new Error(`OpenAI voiceover generation failed: ${error.message}`);
    }
  }

  /**
   * Generate voiceover using ElevenLabs
   */
  async generateVoiceoverElevenLabs(text, options = {}) {
    try {
      const {
        voiceId = config.tts.elevenLabs.voiceId,
        stability = 0.5,
        similarityBoost = 0.75,
        filename = null
      } = options;

      if (!config.tts.elevenLabs.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      logger.info('Generating voiceover with ElevenLabs', {
        textLength: text.length,
        voiceId
      });

      await this.initialize();

      const response = await axios({
        method: 'post',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.tts.elevenLabs.apiKey
        },
        data: {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost
          }
        },
        responseType: 'arraybuffer'
      });

      const outputFilename = filename || `voiceover_elevenlabs_${Date.now()}.mp3`;
      const outputPath = path.join(this.outputDir, sanitizeFilename(outputFilename));

      await fs.writeFile(outputPath, response.data);

      logger.info('Successfully generated voiceover with ElevenLabs', {
        path: outputPath,
        size: response.data.length
      });

      return {
        path: outputPath,
        filename: outputFilename,
        size: response.data.length,
        provider: 'elevenlabs',
        voiceId
      };
    } catch (error) {
      logger.error('Failed to generate voiceover with ElevenLabs', {
        error: error.message
      });
      throw new Error(`ElevenLabs voiceover generation failed: ${error.message}`);
    }
  }

  /**
   * Generate voiceover using configured provider
   */
  async generateVoiceover(text, options = {}) {
    const provider = options.provider || config.tts.provider;

    switch (provider) {
      case 'elevenlabs':
        return await this.generateVoiceoverElevenLabs(text, options);
      case 'openai':
      default:
        return await this.generateVoiceoverOpenAI(text, options);
    }
  }

  /**
   * Generate voiceover for script segments
   */
  async generateSegmentedVoiceovers(segments) {
    try {
      logger.info('Generating segmented voiceovers', {
        segmentCount: segments.length
      });

      const voiceovers = [];

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const voiceover = await this.generateVoiceover(segment, {
          filename: `segment_${i + 1}_${Date.now()}.mp3`
        });
        voiceovers.push(voiceover);
      }

      logger.info('Successfully generated all segment voiceovers', {
        count: voiceovers.length
      });

      return voiceovers;
    } catch (error) {
      logger.error('Failed to generate segmented voiceovers', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get available voices for provider
   */
  getAvailableVoices(provider = 'openai') {
    const voices = {
      openai: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
      elevenlabs: [] // Would need to fetch from API
    };

    return voices[provider] || [];
  }
}

module.exports = VoiceoverService;
