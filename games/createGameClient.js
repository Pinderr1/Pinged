import React, { useEffect, useRef, forwardRef } from 'react';
import { Client } from 'boardgame.io/react-native';

export default function createGameClient(opts) {
  const BaseClient = Client(opts);

  const Wrapped = forwardRef(function Wrapped(props, ref) {
    const { initialState, onStateChange, ...rest } = props;
    const clientRef = useRef(null);

    useEffect(() => {
      const client = clientRef.current?.client;
      if (!client) return;
      if (initialState) {
        try {
          if (client.restore) client.restore(initialState);
          else if (client.updateState) client.updateState(initialState);
          else if (client.reset) client.reset(initialState);
          else if (client.overrideGameState) client.overrideGameState(initialState);
        } catch (e) {
          console.warn('Failed to apply initial state', e);
        }
      }
      if (onStateChange && client.subscribe) {
        const unsub = client.subscribe(() => {
          try {
            onStateChange(client.getState ? client.getState() : client.store.getState());
          } catch (err) {
            console.warn('Failed to report state', err);
          }
        });
        return () => unsub && unsub();
      }
    }, [initialState, onStateChange]);

    return <BaseClient ref={(c) => {
      clientRef.current = c;
      if (typeof ref === 'function') ref(c);
      else if (ref) ref.current = c;
    }} {...rest} />;
  });

  return Wrapped;
}
