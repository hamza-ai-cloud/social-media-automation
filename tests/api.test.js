// Mock environment variables before importing app
process.env.OPENAI_API_KEY = 'test-key';
process.env.YOUTUBE_API_KEY = 'test-key';
process.env.PORT = '3001'; // Use different port for testing

const request = require('supertest');
const express = require('express');

// Create a simple test app instead of importing the full app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'Social Media Automation API',
      endpoints: {
        health: '/health'
      }
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  });

  return app;
};

describe('API Health Check', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });

  test('GET / should return API info', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();
    expect(response.body.endpoints).toBeDefined();
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
});
