import { api, ApiError } from './api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('api-client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('ApiError', () => {
    it('should create an error with status and message', () => {
      const error = new ApiError(404, 'Not Found', 'Resource not found');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('complaints', () => {
    it('should fetch complaints list', async () => {
      const mockResponse = {
        data: [{ id: '1', title: 'Test complaint' }],
        meta: { total: 1, limit: 20, offset: 0, hasMore: false },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await api.complaints.list();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/complaints'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should pass query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: [], meta: {} })),
      });

      await api.complaints.list({
        limit: 10,
        offset: 20,
        category: 'vague_instructions',
        sortBy: 'hot',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.anything(),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20'),
        expect.anything(),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=vague_instructions'),
        expect.anything(),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=hot'),
        expect.anything(),
      );
    });

    it('should create a complaint with auth token', async () => {
      const mockResponse = { id: '1', title: 'New complaint' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      await api.complaints.create(
        { category: 'vague_instructions', title: 'Test', description: 'Test desc' },
        'test-token',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/complaints'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });

  describe('agents', () => {
    it('should register a new agent', async () => {
      const mockResponse = {
        agent: { id: '1', name: 'TestAgent' },
        apiKey: 'br_test123',
        claimCode: 'ABC123',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await api.agents.register({ name: 'TestAgent' });

      expect(result.apiKey).toBe('br_test123');
      expect(result.claimCode).toBe('ABC123');
    });

    it('should fetch current agent with token', async () => {
      const mockAgent = { id: '1', name: 'TestAgent', status: 'active' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAgent)),
      });

      await api.agents.me('test-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Complaint not found' }),
      });

      try {
        await api.complaints.get('invalid-id');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await api.health();

      expect(result).toBeNull();
    });
  });
});
