import React from 'react';
import { useAppStore, selectLoadingVisible, selectLoadingActions } from '../state/appStore';

export const LoadingProvider = ({ children }) => <>{children}</>;

export const useLoading = () => {
  const visible = useAppStore(selectLoadingVisible);
  const { show, hide } = useAppStore(selectLoadingActions);
  return { visible, show, hide };
};

export default LoadingProvider;
