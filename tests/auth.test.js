import { loginWithEmail, signUpWithEmail, createLoginWithGoogle } from '../contexts/AuthContext';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';

jest.mock('../firebase', () => {
  const authMock = {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
  };
  const firestoreMock = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true })),
        set: jest.fn(() => Promise.resolve()),
      })),
    })),
    FieldValue: { serverTimestamp: jest.fn() },
  };
  const firebase = {
    auth: jest.fn(() => authMock),
    firestore: jest.fn(() => firestoreMock),
  };
  return { __esModule: true, default: firebase, auth: firebase.auth, firestore: firebase.firestore, authMock, firestoreMock };
});

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('../utils/email', () => ({ isAllowedDomain: jest.fn(() => true) }));

const { authMock } = jest.requireMock('../firebase');
const toast = jest.requireMock('react-native-toast-message').default;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loginWithEmail', () => {
  test('success case', async () => {
    authMock.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '1' } });
    await expect(loginWithEmail('a@b.com', 'pw')).resolves.not.toThrow();
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });

  test('failure case shows toast', async () => {
    const err = new Error('fail');
    authMock.signInWithEmailAndPassword.mockRejectedValue(err);
    await expect(loginWithEmail('a@b.com', 'pw')).rejects.toThrow(err);
    expect(toast.show).toHaveBeenCalled();
  });
});

describe('signUpWithEmail', () => {
  test('success case', async () => {
    authMock.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: '1', email: 'a@b.com' } });
    await expect(signUpWithEmail('a@b.com', 'pw')).resolves.not.toThrow();
    expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });

  test('failure case shows toast', async () => {
    const err = new Error('oops');
    authMock.createUserWithEmailAndPassword.mockRejectedValue(err);
    await expect(signUpWithEmail('a@b.com', 'pw')).rejects.toThrow(err);
    expect(toast.show).toHaveBeenCalled();
  });
});

describe('loginWithGoogle', () => {
  test('success case', async () => {
    const prompt = jest.fn(() => Promise.resolve('ok'));
    const login = createLoginWithGoogle(prompt);
    await expect(login()).resolves.toBe('ok');
    expect(prompt).toHaveBeenCalledWith({ useProxy: false, prompt: 'select_account' });
    expect(toast.show).not.toHaveBeenCalled();
  });

  test('failure case shows toast', async () => {
    const prompt = jest.fn(() => Promise.reject(new Error('bad')));
    const login = createLoginWithGoogle(prompt);
    await expect(login()).rejects.toThrow('bad');
    expect(toast.show).toHaveBeenCalled();
  });
});
