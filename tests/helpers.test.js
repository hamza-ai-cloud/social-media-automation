// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.YOUTUBE_API_KEY = 'test-key';

const {
  sanitizeFilename,
  formatDuration,
  generateId,
  truncateText,
  extractHashtags,
  chunkArray
} = require('../src/utils/helpers');

describe('Utility Functions', () => {
  describe('sanitizeFilename', () => {
    test('should sanitize filename with special characters', () => {
      const result = sanitizeFilename('Test File!@#$%^&*().mp3');
      expect(result).toBe('test_file__________.mp3');
    });

    test('should handle alphanumeric filenames', () => {
      const result = sanitizeFilename('video_2024.mp4');
      expect(result).toBe('video_2024.mp4');
    });
  });

  describe('formatDuration', () => {
    test('should format duration correctly', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(120)).toBe('2:00');
      expect(formatDuration(0)).toBe('0:00');
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('truncateText', () => {
    test('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncateText(text, 20);
      
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    test('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      
      expect(result).toBe(text);
    });
  });

  describe('extractHashtags', () => {
    test('should extract hashtags from text', () => {
      const text = 'This is a post with #hashtag1 and #hashtag2';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['#hashtag1', '#hashtag2']);
    });

    test('should return empty array if no hashtags', () => {
      const text = 'This is a post without hashtags';
      const result = extractHashtags(text);
      
      expect(result).toEqual([]);
    });
  });

  describe('chunkArray', () => {
    test('should chunk array into smaller arrays', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const result = chunkArray(array, 3);
      
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    test('should handle empty array', () => {
      const result = chunkArray([], 3);
      expect(result).toEqual([]);
    });
  });
});
