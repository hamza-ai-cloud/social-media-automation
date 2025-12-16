require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4'
  },
  
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    channelId: process.env.YOUTUBE_CHANNEL_ID,
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    }
  },
  
  socialMedia: {
    instagram: {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
    },
    tiktok: {
      accessToken: process.env.TIKTOK_ACCESS_TOKEN,
      openId: process.env.TIKTOK_OPEN_ID
    },
    facebook: {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      pageId: process.env.FACEBOOK_PAGE_ID
    },
    linkedin: {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      personUrn: process.env.LINKEDIN_PERSON_URN
    }
  },
  
  tts: {
    provider: process.env.TTS_PROVIDER || 'openai',
    elevenLabs: {
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID
    }
  },
  
  cron: {
    trendDiscovery: process.env.TREND_DISCOVERY_CRON || '0 */6 * * *',
    contentGeneration: process.env.CONTENT_GENERATION_CRON || '0 8 * * *',
    posting: process.env.POSTING_CRON || '0 10 * * *'
  },
  
  content: {
    minVideoDuration: parseInt(process.env.MIN_VIDEO_DURATION) || 60,
    maxVideoDuration: parseInt(process.env.MAX_VIDEO_DURATION) || 600,
    targetAudience: process.env.TARGET_AUDIENCE || 'general',
    contentNiche: process.env.CONTENT_NICHE || 'technology'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
    enabled: process.env.N8N_ENABLED === 'true'
  }
};
