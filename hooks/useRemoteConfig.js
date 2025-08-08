import { useEffect, useState } from 'react';
import firebase from '../firebase';
import { snapshotExists } from '../utils/firestore';

export default function useRemoteConfig() {
  const [config, setConfig] = useState({
    minVersion: null,
    maxFreeGames: null,
    maxDailyEvents: null,
    maxDailyLikes: null,
    resetHour: null,
    timezonePolicy: 'utc',
    enforceLimitsServerSide: false,
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
          maxDailyEvents: data?.maxDailyEvents ?? null,
          maxDailyLikes: data?.maxDailyLikes ?? null,
          resetHour: data?.resetHour ?? null,
          timezonePolicy: data?.timezonePolicy ?? 'utc',
          enforceLimitsServerSide: data?.enforceLimitsServerSide ?? false,
          alertMessage: data?.alertMessage ?? null,
          loading: false,
          error: null,
        });
      },
      (err) => {
        if (err?.code !== 'permission-denied') {
          console.warn('Failed to load remote config', err);
        }
        setConfig((prev) => ({ ...prev, loading: false, error: err }));
      }
    );
    return unsub;
  }, []);

  return config;
}
