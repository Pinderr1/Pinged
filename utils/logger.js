let devMode = false;

export const setLoggerDevMode = (val) => {
  devMode = val;
};

export function logDev(tag, ...args) {
  if (__DEV__ && devMode) {
    // eslint-disable-next-line no-console
    console.log(`[${tag}]`, ...args);
  }
}
