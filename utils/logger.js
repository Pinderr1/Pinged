let loggingEnabled = false;

export const setDevLogging = (enabled) => {
  loggingEnabled = enabled;
};

export function logDev(tag, ...args) {
  if (!loggingEnabled) return;
  const prefix = tag ? `[${tag}]` : '[Dev]';
  // eslint-disable-next-line no-console
  console.log(prefix, ...args);
}
