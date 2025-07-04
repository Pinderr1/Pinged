import React, { createContext, useContext, useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [count, setCount] = useState(0);
  const showLoading = () => setCount((c) => c + 1);
  const hideLoading = () => setCount((c) => Math.max(0, c - 1));
  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <LoadingOverlay visible={count > 0} />
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
