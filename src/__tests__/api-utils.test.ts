import { jsonResponse, errorResponse } from '@/lib/api-utils';

describe('API Utils', () => {
  describe('jsonResponse', () => {
    it('returns a JSON response with default 200 status', async () => {
      const data = { message: 'Hello' };
      const response = jsonResponse(data);
      
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(data);
    });

    it('returns a JSON response with custom status', async () => {
      const data = { id: 1 };
      const response = jsonResponse(data, 201);
      
      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('returns an error response with default 400 status', async () => {
      const response = errorResponse('Bad request');
      
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: 'Bad request' });
    });

    it('returns an error response with custom status', async () => {
      const response = errorResponse('Not found', 404);
      
      expect(response.status).toBe(404);
    });
  });
});
