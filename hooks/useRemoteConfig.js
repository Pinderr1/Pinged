import { useEffect, useState } from 'react';
import firebase from '../firebase';
import { snapshotExists } from '../utils/firestore';

export default function useRemoteConfig() {
  const [config, setConfig] = useState({
    minVersion: null,
    maxFreeGames: null,
    alertMessage: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const ref = firebase.firestore().collection('config').doc('app');
    const unsub = ref.onSnapshot(
      (doc) => {
        const data = snapshotExists(doc) ? doc.data() : {};
        setConfig({
          minVersion: data?.minVersion ?? null,
          maxFreeGames: data?.maxFreeGames ?? null,
          alertMessage: data?.alertMessage ?? null,
          loading: false,
          error: null,
        });
      },
      (err) => {
        console.warn('Failed to load remote config', err);
        setConfig((prev) => ({ ...prev, loading: false, error: err }));
      }
    );
    return unsub;
  }, []);

  return config;
}
