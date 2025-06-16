import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';

describe('NotificationContext', () => {
  test('showNotification sets message and visibility', () => {
    let ctx;
    const Test = () => {
      ctx = useNotification();
      return null;
    };

    renderer.create(
      <NotificationProvider>
        <Test />
      </NotificationProvider>
    );

    act(() => {
      ctx.showNotification('hello');
    });

    expect(ctx.notification).toBe('hello');
    expect(ctx.visible).toBe(true);
  });
});
