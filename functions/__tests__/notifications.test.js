const admin = require('firebase-admin');
const { pushToUser } = require('../notifications');

jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
    onCall: (fn) => fn,
  },
  pubsub: {
    schedule: () => ({
      onRun: (fn) => fn,
      timeZone: () => ({ onRun: (fn) => fn }),
    }),
  },
  logger: { info: jest.fn() },
}));

jest.mock('firebase-admin', () => {
  const firestore = jest.fn();
  return { firestore };
});

const realFetch = global.fetch;

function setupDb(userData = { pushToken: 'tok', notificationsEnabled: true }) {
  const db = {
    collection: () => ({
      doc: () => ({
        get: jest.fn().mockResolvedValue({ data: () => userData }),
        collection: () => ({
          doc: () => ({ get: jest.fn().mockResolvedValue({ data: () => ({ enabled: true }) }) }),
        }),
      }),
    }),
  };
  admin.firestore.mockReturnValue(db);
}

const flush = () => new Promise((resolve) => process.nextTick(resolve));

describe('pushToUser', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupDb();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = realFetch;
    admin.firestore.mockReset();
  });

  it('succeeds without retries on ok response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    global.fetch = fetchMock;

    const res = await pushToUser('u1', 'T', 'B');

    expect(res).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setTimeout).not.toHaveBeenCalled();
  });

  it('retries with exponential backoff and eventually succeeds', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('net'))
      .mockRejectedValueOnce(new Error('server'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    global.fetch = fetchMock;

    const promise = pushToUser('u1', 'T', 'B', {}, { maxAttempts: 5, baseDelay: 100 });

    await flush();
    jest.advanceTimersByTime(100);
    await flush();
    jest.advanceTimersByTime(200);
    await flush();

    const res = await promise;
    expect(res).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const delays = setTimeout.mock.calls.map(([, ms]) => ms);
    expect(delays).toEqual([100, 200]);
  });

  it('throws after maxAttempts on persistent failures', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('fail'));
    global.fetch = fetchMock;

    const promise = pushToUser('u1', 'T', 'B', {}, { maxAttempts: 3, baseDelay: 100 });

    await flush();
    jest.advanceTimersByTime(100);
    await flush();
    jest.advanceTimersByTime(200);
    await flush();

    await expect(promise).rejects.toThrow('fail');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const delays = setTimeout.mock.calls.map(([, ms]) => ms);
    expect(delays).toEqual([100, 200]);
  });
});
