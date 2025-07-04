let devLogging = false;

export const setDevLogging = (enabled) => {
  devLogging = enabled;
};

export function logDev(tag, ...args) {
  if (!devLogging) return;
  const prefix = tag ? `[${tag}]` : '[DEV]';
  // eslint-disable-next-line no-console
  console.log(prefix, ...args);
}
