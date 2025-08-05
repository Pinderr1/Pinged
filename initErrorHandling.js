import { handleError } from './utils/errorHandling';

const initErrorHandling = () => {
  if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
    const defaultHandler = (error, isFatal) => {
      handleError(error);
    };
    global.ErrorUtils.setGlobalHandler(defaultHandler);
  }

  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason);
    });
  }
};

export default initErrorHandling;
