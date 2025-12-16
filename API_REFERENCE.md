# API Reference

## Table of Contents
1. [Authentication](#authentication)
2. [Content Endpoints](#content-endpoints)
3. [Trends Endpoints](#trends-endpoints)
4. [Script Endpoints](#script-endpoints)
5. [Jobs Endpoints](#jobs-endpoints)
6. [Error Responses](#error-responses)

## Authentication

Currently, the API does not require authentication. For production deployments, consider implementing:
- API key authentication
- JWT tokens
- OAuth 2.0

## Content Endpoints

### Generate Complete Content

Generates a complete content package including script, voiceover, visuals, and SEO metadata.

**Endpoint:** `POST /api/content/generate`

**Request Body:**
```json
{
  "topic": "string (optional - will auto-discover if not provided)",
  "niche": "string (optional - defaults to config)",
  "duration": "number (optional - defaults to 120)",
  "autoDiscoverTrend": "boolean (optional - defaults to true)"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "1234567890-abc123",
    "topic": "AI Technology Trends 2024",
    "niche": "technology",
    "script": {
      "hook": "Opening hook text",
      "mainContent": ["Content paragraph 1", "Content paragraph 2"],
      "callToAction": "CTA text",
      "fullScript": "Complete script text"
    },
    "voiceover": {
      "path": "/path/to/audio.mp3",
      "filename": "voiceover_123.mp3",
      "size": 1234567,
      "provider": "openai"
    },
    "visuals": {
      "prompts": [
        {
          "visual": "Visual description",
          "textOverlay": "Text to display",
          "duration": 10,
          "notes": "Additional notes"
        }
      ]
    },
    "thumbnails": {
      "thumbnailConcepts": "3 thumbnail concepts..."
    },
    "seoMetadata": {
      "title": "Optimized Video Title",
      "description": "Complete video description",
      "tags": ["tag1", "tag2", "tag3"],
      "hashtags": ["#hashtag1", "#hashtag2"],
      "category": "Education",
      "keywords": ["keyword1", "keyword2"]
    },
    "brollSuggestions": ["suggestion1", "suggestion2"],
    "metadata": {
      "createdAt": "2024-01-01T00:00:00.000Z",
      "duration": 120,
      "platforms": ["youtube"],
      "status": "generated"
    }
  }
}
```

### Repurpose Content

Adapts content for specific social media platforms.

**Endpoint:** `POST /api/content/repurpose`

**Request Body:**
```json
{
  "content": { /* Content object from generate endpoint */ },
  "platforms": ["instagram", "tiktok", "facebook", "linkedin"]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "instagram": {
      "caption": "Optimized caption for Instagram",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "aspectRatio": "9:16",
      "duration": 60
    },
    "tiktok": { /* TikTok-optimized content */ },
    "facebook": { /* Facebook-optimized content */ },
    "linkedin": { /* LinkedIn-optimized content */ }
  }
}
```

### Publish Content

Publishes content to specified platforms.

**Endpoint:** `POST /api/content/publish`

**Request Body:**
```json
{
  "content": { /* Content object */ },
  "platforms": ["instagram", "facebook"]
}
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "platform": "instagram",
      "postId": "12345",
      "url": "https://www.instagram.com/p/12345/",
      "success": true
    },
    {
      "platform": "facebook",
      "success": false,
      "error": "Access token expired"
    }
  ]
}
```

## Trends Endpoints

### Get YouTube Trends

Retrieves currently trending videos on YouTube.

**Endpoint:** `GET /api/trends/youtube`

**Query Parameters:**
- `regionCode` (optional): Country code (default: "US")
- `maxResults` (optional): Number of results (default: 20, max: 50)
- `videoCategoryId` (optional): Filter by category

**Response:**
```json
{
  "status": "success",
  "count": 20,
  "data": [
    {
      "videoId": "abc123",
      "title": "Video Title",
      "description": "Video description",
      "channelTitle": "Channel Name",
      "viewCount": 1000000,
      "likeCount": 50000,
      "commentCount": 5000,
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### Search Trending Keywords

Searches for videos matching specific keywords.

**Endpoint:** `GET /api/trends/search`

**Query Parameters:**
- `keywords` (required): Search terms
- `maxResults` (optional): Number of results (default: 10)
- `order` (optional): Sort order (default: "viewCount")

### Get Niche Trends

Gets trending topics for a specific niche.

**Endpoint:** `GET /api/trends/niche/:niche`

**Path Parameters:**
- `niche`: One of: technology, finance, health, entertainment, education

**Response:**
```json
{
  "status": "success",
  "count": 10,
  "data": [
    {
      "videoId": "abc123",
      "title": "Trending Topic",
      "engagementRate": 5.2,
      "trendScore": 85.5
    }
  ]
}
```

## Script Endpoints

### Generate Script

Generates a video script based on topic.

**Endpoint:** `POST /api/script/generate`

**Request Body:**
```json
{
  "topic": "AI Technology in 2024",
  "duration": 120,
  "tone": "engaging",
  "targetAudience": "general"
}
```

**Tone Options:**
- engaging
- educational
- entertaining
- inspiring
- conversational

**Response:**
```json
{
  "status": "success",
  "data": {
    "topic": "AI Technology in 2024",
    "duration": 120,
    "hook": "Opening hook",
    "mainContent": ["Content sections"],
    "callToAction": "CTA",
    "fullScript": "Complete script",
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "model": "gpt-4",
      "tokens": 500
    }
  }
}
```

### Generate Voiceover Text

Converts script to voiceover-optimized format.

**Endpoint:** `POST /api/script/voiceover`

**Request Body:**
```json
{
  "script": "Your video script text here"
}
```

### Generate Script Variations

Generates multiple script variations for the same topic.

**Endpoint:** `POST /api/script/variations`

**Request Body:**
```json
{
  "topic": "AI Technology",
  "count": 3
}
```

## Jobs Endpoints

### Get Job Status

Returns status of all scheduled jobs.

**Endpoint:** `GET /api/jobs/status`

**Response:**
```json
{
  "status": "success",
  "data": {
    "trendDiscovery": {
      "running": true,
      "schedule": "0 */6 * * *"
    },
    "contentGeneration": {
      "running": true,
      "schedule": "0 8 * * *"
    },
    "contentPosting": {
      "running": true,
      "schedule": "0 10 * * *"
    }
  }
}
```

### Run Job Manually

Triggers a specific job immediately.

**Endpoint:** `POST /api/jobs/run/:jobName`

**Path Parameters:**
- `jobName`: One of: trendDiscovery, contentGeneration, contentPosting

**Response:**
```json
{
  "status": "success",
  "message": "Job contentGeneration executed successfully",
  "data": { /* Job result */ }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

**Common Status Codes:**
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (endpoint doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

**Example Error:**
```json
{
  "status": "error",
  "message": "Topic is required"
}
```

## Rate Limiting

The API implements rate limiting:
- **Window:** 15 minutes
- **Max Requests:** 100 per IP address

When rate limit is exceeded:
```json
{
  "status": "error",
  "message": "Too many requests from this IP, please try again later."
}
```

## Best Practices

1. **Handle Errors:** Always check the `status` field in responses
2. **Retry Logic:** Implement exponential backoff for failed requests
3. **Validate Input:** Ensure all required fields are provided
4. **Monitor Rate Limits:** Track your request count
5. **Use Webhooks:** Enable n8n webhooks for async notifications
6. **Cache Responses:** Cache trend data to reduce API calls
