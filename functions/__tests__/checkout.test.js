let stripeMock;

jest.mock('stripe', () => jest.fn(() => stripeMock));

const functions = require('firebase-functions');

describe('createCheckoutSession', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_PRICE_ID = 'price_123';
    stripeMock = { checkout: { sessions: { create: jest.fn() } } };
  });

  it('creates a Stripe checkout session with correct parameters', async () => {
    stripeMock.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.session/url' });
    const { createCheckoutSession } = require('../index');
    const context = { auth: { uid: 'user1' } };
    const data = { successUrl: 'http://success', cancelUrl: 'http://cancel' };
    const res = await createCheckoutSession(data, context);
    expect(res).toEqual({ url: 'https://stripe.session/url' });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      metadata: { uid: 'user1' },
      success_url: 'http://success',
      cancel_url: 'http://cancel'
    });
  });

  it('throws on unauthenticated call', async () => {
    const { createCheckoutSession } = require('../index');
    await expect(createCheckoutSession({}, { auth: null })).rejects.toBeInstanceOf(functions.https.HttpsError || Error);
  });
});
