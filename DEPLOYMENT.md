# Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [Production Checklist](#production-checklist)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- API keys for required services
- Server with at least 1GB RAM
- SSL certificate (recommended for production)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/hamza-ai-cloud/social-media-automation.git
cd social-media-automation
npm install --production
```

### 2. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with production values:

```env
NODE_ENV=production
PORT=3000

# Required
OPENAI_API_KEY=your_production_key
YOUTUBE_API_KEY=your_production_key

# Optional but recommended
INSTAGRAM_ACCESS_TOKEN=your_token
FACEBOOK_ACCESS_TOKEN=your_token
LINKEDIN_ACCESS_TOKEN=your_token
TIKTOK_ACCESS_TOKEN=your_token

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/content-ready
N8N_ENABLED=true
```

## Deployment Options

### Option 1: PM2 (Recommended)

PM2 is a production process manager for Node.js applications.

**Install PM2:**
```bash
npm install -g pm2
```

**Start Application:**
```bash
pm2 start src/index.js --name social-media-automation
```

**Save Process List:**
```bash
pm2 save
```

**Setup Auto-Start on Boot:**
```bash
pm2 startup
# Follow the instructions from the command output
```

**Useful PM2 Commands:**
```bash
pm2 status                    # Check status
pm2 logs social-media-automation  # View logs
pm2 restart social-media-automation  # Restart app
pm2 stop social-media-automation     # Stop app
pm2 delete social-media-automation   # Remove from PM2
```

**PM2 Ecosystem File (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'social-media-automation',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

Start with ecosystem file:
```bash
pm2 start ecosystem.config.js
```

### Option 2: Docker

**Create Dockerfile:**
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directories
RUN mkdir -p logs output

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./output:/app/output
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
```

**Build and Run:**
```bash
docker-compose up -d
```

**View Logs:**
```bash
docker-compose logs -f
```

### Option 3: Systemd Service

**Create service file:** `/etc/systemd/system/social-media-automation.service`

```ini
[Unit]
Description=Social Media Automation Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/social-media-automation
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=social-media-automation
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**
```bash
sudo systemctl enable social-media-automation
sudo systemctl start social-media-automation
sudo systemctl status social-media-automation
```

### Option 4: Cloud Platforms

#### Heroku
```bash
heroku create social-media-automation
heroku config:set OPENAI_API_KEY=your_key
heroku config:set YOUTUBE_API_KEY=your_key
git push heroku main
```

#### AWS EC2
1. Launch EC2 instance (Ubuntu/Amazon Linux)
2. Install Node.js
3. Clone repository
4. Use PM2 or systemd (see above)
5. Configure security groups (allow port 3000)

#### DigitalOcean
1. Create Droplet
2. Follow PM2 deployment steps
3. Configure firewall
4. Optional: Add load balancer

#### Railway/Render
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

## Production Checklist

### Security
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (SSL/TLS certificate)
- [ ] Secure environment variables
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Keep dependencies updated
- [ ] Use strong API keys
- [ ] Implement API authentication (if needed)

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize database queries (if using DB)
- [ ] Monitor memory usage
- [ ] Set appropriate timeout values

### Reliability
- [ ] Configure auto-restart (PM2/Docker)
- [ ] Set up health checks
- [ ] Implement graceful shutdown
- [ ] Configure log rotation
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Create backup strategy

### Monitoring
- [ ] Set up application monitoring
- [ ] Configure log aggregation
- [ ] Create alerts for errors
- [ ] Monitor API usage
- [ ] Track cron job execution
- [ ] Monitor disk space

## Monitoring

### Application Logs

Logs are stored in `./logs/`:
- `combined.log` - All application logs
- `error.log` - Error logs
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled rejections

### Log Rotation

Install logrotate:
```bash
sudo apt-get install logrotate
```

Create `/etc/logrotate.d/social-media-automation`:
```
/opt/social-media-automation/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Monitoring

Use monitoring services:

**Uptime Robot:**
- Monitor endpoint: `https://your-domain.com/health`
- Alert on downtime

**New Relic / Datadog:**
```bash
npm install newrelic
# Configure newrelic.js
```

**Prometheus + Grafana:**
- Export metrics from your app
- Create dashboards for visualization

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
pm2 logs social-media-automation
# or
docker-compose logs -f
```

**Common issues:**
- Missing environment variables
- Port already in use
- Insufficient permissions
- Missing dependencies

### High Memory Usage

**Monitor with PM2:**
```bash
pm2 monit
```

**Solutions:**
- Restart application
- Increase available memory
- Check for memory leaks
- Optimize code

### API Errors

**Check API keys:**
```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test YouTube
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&key=$YOUTUBE_API_KEY"
```

### Cron Jobs Not Running

**Verify cron syntax:**
```bash
# Use crontab validator
# Check logs for scheduler errors
```

**Manual test:**
```bash
curl -X POST http://localhost:3000/api/jobs/run/contentGeneration
```

### Database Connection Issues (Future Enhancement)

If you add database support:
- Check connection string
- Verify credentials
- Test network connectivity
- Check firewall rules

## Backup and Recovery

### Backup Strategy

**What to backup:**
- Environment variables (.env)
- Generated content (./output/)
- Application logs (./logs/)
- Database (if implemented)

**Backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/social-media-automation"

mkdir -p $BACKUP_DIR

# Backup output directory
tar -czf $BACKUP_DIR/output_$DATE.tar.gz ./output/

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz ./logs/

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Recovery

**Restore from backup:**
```bash
tar -xzf output_20240101_120000.tar.gz
tar -xzf logs_20240101_120000.tar.gz
```

## Scaling

### Horizontal Scaling

Use load balancer with multiple instances:

**Nginx configuration:**
```nginx
upstream social_media_automation {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://social_media_automation;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Vertical Scaling

Increase server resources:
- More CPU cores
- More RAM
- Faster disk I/O

## Support

For issues and questions:
- GitHub Issues: https://github.com/hamza-ai-cloud/social-media-automation/issues
- Documentation: README.md and API_REFERENCE.md
