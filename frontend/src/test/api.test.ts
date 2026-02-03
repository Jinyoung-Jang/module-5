import { apiRequest } from '@/lib/api';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('apiRequest', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should make a successful request and return JSON data', async () => {
    const mockData = { id: 1, name: 'Test User' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await apiRequest('/users/1');

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/1',
      expect.objectContaining({
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should include credentials: include option', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest('/test');

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1]).toHaveProperty('credentials', 'include');
  });

  it('should merge custom headers with default headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest('/test', {
      headers: {
        'Authorization': 'Bearer token123',
      },
    });

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123',
    });
  });

  it('should throw an error when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(apiRequest('/protected')).rejects.toThrow('Unauthorized');
  });

  it('should throw an error with HTTP status when error text is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    });

    await expect(apiRequest('/error')).rejects.toThrow('HTTP 500');
  });

  it('should support POST requests with body', async () => {
    const requestBody = { email: 'test@example.com', password: 'password123' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].body).toBe(JSON.stringify(requestBody));
  });
});
