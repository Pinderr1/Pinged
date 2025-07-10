const mockCreate = jest.fn().mockResolvedValue({ url: 'https://checkout.example' });
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockCreate } }
  }));
});

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ data: () => ({ expoPushToken: 'token' }) })
  }))
}));

process.env.STRIPE_SECRET_KEY = 'sk_test';
process.env.STRIPE_PRICE_ID = 'price_123';
process.env.EXPO_PUBLIC_SUCCESS_URL = 'https://success.example';
process.env.EXPO_PUBLIC_CANCEL_URL = 'https://cancel.example';

const functions = require('../index');

describe('createCheckoutSession', () => {
  it('requires authentication', async () => {
    await expect(functions.createCheckoutSession({}, { auth: null }))
      .rejects.toThrow('User must be authenticated');
  });

  it('creates a Stripe checkout session', async () => {
    const data = { successUrl: 'https://s', cancelUrl: 'https://c' };
    const context = { auth: { uid: 'user1' } };
    const result = await functions.createCheckoutSession(data, context);

    expect(mockCreate).toHaveBeenCalledWith({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      metadata: { uid: 'user1' },
      success_url: 'https://s',
      cancel_url: 'https://c'
    });
    expect(result).toEqual({ url: 'https://checkout.example' });
  });
});
