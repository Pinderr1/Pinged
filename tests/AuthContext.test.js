;(async () => {
  const { createLoginWithGoogle } = await import('../contexts/googleAuth.js');
  let savedUser = null;
  let onboarded = false;

  const promptAsync = async () => ({ type: 'success', params: { id_token: 'tok' } });

  const fakeUser = { uid: 'uid1', email: 'test@example.com' };

  const authFn = () => ({
    signInWithCredential: async () => ({ user: fakeUser }),
  });
  authFn.GoogleAuthProvider = { credential: () => ({}) };
  const firebase = {
    auth: authFn,
    firestore: () => ({
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: true, data: () => ({ onboardingComplete: true }) }),
        }),
      }),
    }),
  };

  const ensureUserDoc = async (user) => {
    savedUser = user;
  };

  const markOnboarded = () => {
    onboarded = true;
  };

  const loginWithGoogle = createLoginWithGoogle({
    promptAsync,
    firebase,
    ensureUserDoc,
    markOnboarded,
  });

  const user = await loginWithGoogle();

  if (user !== fakeUser) throw new Error('User not returned');
  if (savedUser !== fakeUser) throw new Error('User doc not saved');
  if (!onboarded) throw new Error('onboardComplete not set');
})();
