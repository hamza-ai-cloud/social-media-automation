/**
 * Example Usage of Social Media Automation System
 * 
 * This file demonstrates how to use the various modules
 * of the faceless YouTube automation system.
 */

require('dotenv').config();
const ContentOrchestrator = require('./src/services/contentOrchestrator');
const TrendDiscoveryService = require('./src/modules/trendDiscovery/trendDiscovery.service');
const ScriptGenerationService = require('./src/modules/scriptGeneration/scriptGeneration.service');

// Example 1: Discover Trending Topics
async function exampleDiscoverTrends() {
  console.log('\n=== Example 1: Discover Trending Topics ===\n');
  
  const trendService = new TrendDiscoveryService();
  
  try {
    // Get trending topics for technology niche
    const trends = await trendService.getTrendingTopicsForNiche('technology');
    
    console.log(`Found ${trends.length} trending topics:`);
    trends.slice(0, 5).forEach((trend, index) => {
      console.log(`${index + 1}. ${trend.title}`);
      console.log(`   Score: ${trend.trendScore}`);
      console.log(`   Engagement: ${trend.engagementRate}%`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Generate a Script
async function exampleGenerateScript() {
  console.log('\n=== Example 2: Generate a Script ===\n');
  
  const scriptService = new ScriptGenerationService();
  
  try {
    const script = await scriptService.generateVideoScript({
      topic: 'The Future of AI in 2024',
      duration: 120,
      tone: 'engaging',
      targetAudience: 'general'
    });
    
    console.log('Generated Script:');
    console.log('\nHook:', script.hook);
    console.log('\nMain Content Preview:', script.mainContent.slice(0, 2).join('\n'));
    console.log('\nCall to Action:', script.callToAction);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 3: Generate Complete Content Package
async function exampleCompleteContent() {
  console.log('\n=== Example 3: Generate Complete Content Package ===\n');
  
  const orchestrator = new ContentOrchestrator();
  
  try {
    const content = await orchestrator.generateCompleteContent({
      topic: 'How AI is Transforming Technology',
      niche: 'technology',
      duration: 90,
      autoDiscoverTrend: false
    });
    
    console.log('Content Package Generated:');
    console.log(`- Content ID: ${content.id}`);
    console.log(`- Topic: ${content.topic}`);
    console.log(`- Title: ${content.seoMetadata.title}`);
    console.log(`- Tags: ${content.seoMetadata.tags.slice(0, 5).join(', ')}`);
    console.log(`- Voiceover: ${content.voiceover.filename}`);
    console.log(`- Visual Scenes: ${content.visuals.prompts.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 4: Repurpose Content for Platforms
async function exampleRepurposeContent() {
  console.log('\n=== Example 4: Repurpose Content for Platforms ===\n');
  
  const orchestrator = new ContentOrchestrator();
  
  try {
    // First, generate content
    const content = await orchestrator.generateCompleteContent({
      topic: 'Quick Tech Tips',
      duration: 60,
      autoDiscoverTrend: false
    });
    
    // Then repurpose for different platforms
    const repurposed = await orchestrator.repurposeContent(content, [
      'instagram',
      'tiktok',
      'linkedin'
    ]);
    
    console.log('Content Repurposed:');
    Object.keys(repurposed).forEach(platform => {
      console.log(`\n${platform.toUpperCase()}:`);
      console.log(`  Caption length: ${repurposed[platform].caption?.length || repurposed[platform].text?.length || 0}`);
      console.log(`  Hashtags: ${repurposed[platform].hashtags.length}`);
      console.log(`  Aspect ratio: ${repurposed[platform].aspectRatio || 'N/A'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 5: Making API Calls
function exampleAPIUsage() {
  console.log('\n=== Example 5: API Usage Examples ===\n');
  
  console.log('1. Generate Content via API:');
  console.log(`
POST http://localhost:3000/api/content/generate
Content-Type: application/json

{
  "topic": "AI Technology Trends",
  "niche": "technology",
  "duration": 120
}
  `);
  
  console.log('\n2. Get Trending Topics:');
  console.log(`
GET http://localhost:3000/api/trends/niche/technology
  `);
  
  console.log('\n3. Generate Script:');
  console.log(`
POST http://localhost:3000/api/script/generate
Content-Type: application/json

{
  "topic": "Machine Learning Basics",
  "duration": 90,
  "tone": "educational"
}
  `);
  
  console.log('\n4. Manually Run Content Generation Job:');
  console.log(`
POST http://localhost:3000/api/jobs/run/contentGeneration
  `);
}

// Example 6: Using with n8n
function exampleN8nIntegration() {
  console.log('\n=== Example 6: n8n Workflow Integration ===\n');
  
  console.log('n8n Workflow Steps:');
  console.log('1. Trigger: Schedule (daily at 8 AM)');
  console.log('2. HTTP Request: POST to /api/content/generate');
  console.log('3. Wait: For webhook notification');
  console.log('4. Review: Manual approval step (optional)');
  console.log('5. HTTP Request: POST to /api/content/publish');
  console.log('6. Notification: Send success/failure alert');
  
  console.log('\nWebhook Configuration:');
  console.log('Set in .env:');
  console.log('N8N_WEBHOOK_URL=http://your-n8n-instance:5678/webhook/content-ready');
  console.log('N8N_ENABLED=true');
}

// Main function to run examples
async function main() {
  const args = process.argv.slice(2);
  const example = args[0] || 'all';
  
  console.log('Social Media Automation - Usage Examples');
  console.log('=========================================');
  
  switch (example) {
    case '1':
      await exampleDiscoverTrends();
      break;
    case '2':
      await exampleGenerateScript();
      break;
    case '3':
      await exampleCompleteContent();
      break;
    case '4':
      await exampleRepurposeContent();
      break;
    case '5':
      exampleAPIUsage();
      break;
    case '6':
      exampleN8nIntegration();
      break;
    case 'all':
      console.log('\nAvailable Examples:');
      console.log('1. Discover Trending Topics');
      console.log('2. Generate a Script');
      console.log('3. Generate Complete Content Package');
      console.log('4. Repurpose Content for Platforms');
      console.log('5. API Usage Examples');
      console.log('6. n8n Integration Example');
      console.log('\nRun: node examples.js [1-6]');
      break;
    default:
      console.log('Invalid example number. Use 1-6 or "all"');
  }
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  exampleDiscoverTrends,
  exampleGenerateScript,
  exampleCompleteContent,
  exampleRepurposeContent
};
