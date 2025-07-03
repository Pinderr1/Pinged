export function logDev(...args) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
