// tests/middleware/validation.test.js
const { validatePost } = require('../../middleware/validation');
const { mockRequest, mockResponse } = require('../mocks'); // Helper functions for mocking req/res

describe('validatePost Middleware', () => {
  it('should return 400 if title is missing', () => {
    const req = mockRequest({ body: { content: 'Test content' } });
    const res = mockResponse();
    const next = jest.fn();

    validatePost[2](req, res, next); // Execute the validation middleware

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: expect.any(Array) });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if validation passes', () => {
    const req = mockRequest({ body: { title: 'Test title', content: 'Test content' } });
    const res = mockResponse();
    const next = jest.fn();

    validatePost[2](req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});