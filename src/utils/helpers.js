const axios = require('axios');
const logger = require('../config/logger');

/**
 * Make HTTP request with error handling and retries
 */
async function makeRequest(url, options = {}, retries = 3) {
  const { method = 'GET', headers = {}, data = null, timeout = 30000 } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
        timeout
      });
      return response.data;
    } catch (error) {
      logger.error(`Request failed (attempt ${i + 1}/${retries})`, {
        url,
        error: error.message
      });
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate required environment variables
 */
function validateEnvVars(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
}

/**
 * Format duration in seconds to readable format
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Parse hashtags from text
 */
function extractHashtags(text) {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  return text.match(hashtagRegex) || [];
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

module.exports = {
  makeRequest,
  sleep,
  validateEnvVars,
  sanitizeFilename,
  formatDuration,
  generateId,
  chunkArray,
  extractHashtags,
  truncateText
};
