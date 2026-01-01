import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaClient, getOllamaClient } from '../client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OllamaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      const client = new OllamaClient();
      expect(client.getBaseUrl()).toBe('http://localhost:11434');
      expect(client.getModel()).toBe('llama3.2:latest');
    });

    it('should use provided options', () => {
      const client = new OllamaClient({
        host: 'http://custom:1234',
        model: 'custom-model',
        timeout: 30000,
      });
      expect(client.getBaseUrl()).toBe('http://custom:1234');
      expect(client.getModel()).toBe('custom-model');
    });
  });

  describe('isAvailable', () => {
    it('should return true when Ollama responds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      const client = new OllamaClient();
      const available = await client.isAvailable();

      expect(available).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when Ollama is not responding', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const client = new OllamaClient();
      const available = await client.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const client = new OllamaClient();
      const available = await client.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('listModels', () => {
    it('should return list of models', async () => {
      const mockModels = [
        { name: 'llama3.2:latest', size: 1000000 },
        { name: 'mistral:latest', size: 2000000 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: mockModels }),
      });

      const client = new OllamaClient();
      const models = await client.listModels();

      expect(models).toEqual(mockModels);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new OllamaClient();
      const models = await client.listModels();

      expect(models).toEqual([]);
    });
  });

  describe('hasModel', () => {
    it('should return true when model exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'llama3.2:latest' }],
        }),
      });

      const client = new OllamaClient();
      const hasModel = await client.hasModel('llama3.2:latest');

      expect(hasModel).toBe(true);
    });

    it('should match model prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'llama3.2:latest' }],
        }),
      });

      const client = new OllamaClient();
      const hasModel = await client.hasModel('llama3.2');

      expect(hasModel).toBe(true);
    });

    it('should return false when model does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [{ name: 'mistral:latest' }],
        }),
      });

      const client = new OllamaClient();
      const hasModel = await client.hasModel('llama3.2');

      expect(hasModel).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate response from prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Generated response',
          done: true,
        }),
      });

      const client = new OllamaClient();
      const response = await client.generate('Test prompt');

      expect(response).toBe('Generated response');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should include system prompt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Response with system',
          done: true,
        }),
      });

      const client = new OllamaClient();
      await client.generate('Test prompt', { system: 'You are helpful' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are helpful');
    });

    it('should throw error on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      const client = new OllamaClient();

      await expect(client.generate('Test')).rejects.toThrow('Ollama generate failed');
    });
  });

  describe('chat', () => {
    it('should send chat messages and return response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: { role: 'assistant', content: 'Hello!' },
          done: true,
        }),
      });

      const client = new OllamaClient();
      const response = await client.chat([
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hi' },
      ]);

      expect(response).toEqual({ role: 'assistant', content: 'Hello!' });
    });

    it('should pass options to the request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: { role: 'assistant', content: 'Response' },
          done: true,
        }),
      });

      const client = new OllamaClient();
      await client.chat(
        [{ role: 'user', content: 'Test' }],
        { temperature: 0.5, maxTokens: 1000 }
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.temperature).toBe(0.5);
      expect(callBody.options.num_predict).toBe(1000);
    });
  });

  describe('getOllamaClient singleton', () => {
    it('should return the same instance', () => {
      const client1 = getOllamaClient();
      const client2 = getOllamaClient();

      expect(client1).toBe(client2);
    });
  });
});
