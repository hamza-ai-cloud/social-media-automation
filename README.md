# Social Media Automation - Faceless YouTube & Multi-Platform System

A production-ready system for faceless YouTube automation and multi-platform social media posting. Automatically discovers trends, generates high-retention scripts, voiceover-ready text, faceless visual prompts, and SEO metadata. Repurposes content for Instagram, TikTok, Facebook, and LinkedIn.

## 🚀 Features

### Core Capabilities
- **Trend Discovery**: Auto-discover trending topics on YouTube by niche
- **Script Generation**: AI-powered high-retention video scripts
- **Voiceover Generation**: Text-to-speech with OpenAI and ElevenLabs support
- **Visual Prompts**: Faceless video scene descriptions and B-roll suggestions
- **SEO Optimization**: Automatic title, description, tags, hashtags, and chapters
- **Multi-Platform**: Repurpose and post to Instagram, TikTok, Facebook, LinkedIn

### Technical Features
- **API-First**: RESTful API with comprehensive endpoints
- **n8n Compatible**: Webhook integration for workflow automation
- **Modular Architecture**: Clean, scalable, and maintainable code
- **Cron Scheduling**: Automated content discovery, generation, and posting
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: API rate limiting for security
- **Environment Config**: Full configuration via environment variables

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- OpenAI API key (for script generation and TTS)
- YouTube Data API key (for trend discovery)
- Social media platform API credentials (optional, for posting)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/hamza-ai-cloud/social-media-automation.git
cd social-media-automation
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys and configuration:
```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Optional (for social media posting)
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token
LINKEDIN_ACCESS_TOKEN=your_linkedin_token
TIKTOK_ACCESS_TOKEN=your_tiktok_token
```

4. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📁 Project Structure

```
social-media-automation/
├── src/
│   ├── config/              # Configuration files
│   │   ├── config.js        # Environment configuration
│   │   └── logger.js        # Winston logger setup
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js  # Error handling middleware
│   │   └── rateLimiter.js   # Rate limiting middleware
│   ├── modules/             # Core business logic modules
│   │   ├── trendDiscovery/  # YouTube trend discovery
│   │   ├── scriptGeneration/# AI script generation
│   │   ├── voiceover/       # Text-to-speech generation
│   │   ├── visualGeneration/# Visual prompts and thumbnails
│   │   ├── seoMetadata/     # SEO metadata generation
│   │   └── platformIntegration/ # Social media posting
│   ├── services/            # Orchestration services
│   │   └── contentOrchestrator.js # Content pipeline orchestrator
│   ├── routes/              # API routes
│   │   ├── content.routes.js
│   │   ├── trends.routes.js
│   │   ├── script.routes.js
│   │   └── jobs.routes.js
│   ├── jobs/                # Cron job scheduling
│   │   └── scheduler.js
│   ├── utils/               # Utility functions
│   │   └── helpers.js
│   └── index.js             # Express app entry point
├── tests/                   # Test files
│   ├── api.test.js
│   └── helpers.test.js
├── logs/                    # Application logs
├── output/                  # Generated content (audio, etc.)
├── .env.example             # Example environment variables
├── .gitignore
├── package.json
├── jest.config.js           # Jest test configuration
├── .eslintrc.js             # ESLint configuration
└── README.md
```

## 🔧 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```http
GET /health
```

#### Content Generation

**Generate Complete Content Package**
```http
POST /api/content/generate
Content-Type: application/json

{
  "topic": "AI Technology Trends 2024",
  "niche": "technology",
  "duration": 120,
  "autoDiscoverTrend": true
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "content-id",
    "topic": "AI Technology Trends 2024",
    "script": { ... },
    "voiceover": { ... },
    "visuals": { ... },
    "seoMetadata": { ... }
  }
}
```

**Repurpose Content**
```http
POST /api/content/repurpose
Content-Type: application/json

{
  "content": { ... },
  "platforms": ["instagram", "tiktok", "facebook", "linkedin"]
}
```

**Publish Content**
```http
POST /api/content/publish
Content-Type: application/json

{
  "content": { ... },
  "platforms": ["instagram", "facebook"]
}
```

#### Trend Discovery

**Get YouTube Trends**
```http
GET /api/trends/youtube?regionCode=US&maxResults=20
```

**Search Trending Keywords**
```http
GET /api/trends/search?keywords=AI%20technology&maxResults=10
```

**Get Niche Trends**
```http
GET /api/trends/niche/technology
```

#### Script Generation

**Generate Script**
```http
POST /api/script/generate
Content-Type: application/json

{
  "topic": "How AI is Changing Technology",
  "duration": 120,
  "tone": "engaging",
  "targetAudience": "general"
}
```

**Generate Voiceover Text**
```http
POST /api/script/voiceover
Content-Type: application/json

{
  "script": "Your video script here..."
}
```

**Generate Script Variations**
```http
POST /api/script/variations
Content-Type: application/json

{
  "topic": "AI Technology",
  "count": 3
}
```

#### Job Management

**Get Job Status**
```http
GET /api/jobs/status
```

**Manually Trigger Job**
```http
POST /api/jobs/run/contentGeneration
```

Available jobs:
- `trendDiscovery` - Discover trending topics
- `contentGeneration` - Generate complete content
- `contentPosting` - Post content to platforms

## ⚙️ Configuration

### Cron Schedules

Configure automated tasks in `.env`:

```env
# Every 6 hours
TREND_DISCOVERY_CRON=0 */6 * * *

# Daily at 8 AM
CONTENT_GENERATION_CRON=0 8 * * *

# Daily at 10 AM
POSTING_CRON=0 10 * * *
```

### Content Settings

```env
MIN_VIDEO_DURATION=60
MAX_VIDEO_DURATION=600
TARGET_AUDIENCE=general
CONTENT_NICHE=technology
```

### n8n Integration

Enable webhook notifications to n8n:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/content-ready
N8N_ENABLED=true
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Run linting:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## 🔐 Security Features

- Helmet.js for security headers
- CORS enabled
- Rate limiting (100 requests per 15 minutes)
- Input validation
- Error sanitization in production
- Environment-based configuration

## 📊 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set:
- `NODE_ENV=production`
- `OPENAI_API_KEY`
- `YOUTUBE_API_KEY`
- Social media credentials (if using posting features)

### Process Management

Use PM2 for production:
```bash
npm install -g pm2
pm2 start src/index.js --name social-media-automation
pm2 save
pm2 startup
```

### Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

Build and run:
```bash
docker build -t social-media-automation .
docker run -p 3000:3000 --env-file .env social-media-automation
```

## 🤝 n8n Workflow Integration

This system is designed to work seamlessly with n8n workflows:

1. **Trigger**: HTTP Request or Webhook
2. **Generate Content**: POST to `/api/content/generate`
3. **Repurpose**: POST to `/api/content/repurpose`
4. **Review/Edit**: Manual step or AI enhancement
5. **Publish**: POST to `/api/content/publish`
6. **Monitor**: Webhook notification when content is ready

## 📝 License

MIT License

## 🙏 Acknowledgments

- OpenAI for GPT models and TTS
- Google for YouTube Data API
- Social media platforms for their APIs