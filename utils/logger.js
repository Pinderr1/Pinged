export const logDev = (...args) => {
  if (__DEV__) console.log(...args);
};
