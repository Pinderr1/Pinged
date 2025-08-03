const LEVELS = ['debug', 'info', 'warn', 'error'];
let currentLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level) {
  return levelOrder[level] >= levelOrder[currentLevel];
}

function sendToSentry(error) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace('/', '');
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`;
    const auth = `Sentry sentry_version=7,sentry_key=${url.username},sentry_client=pinged-logger/1.0`;
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': auth,
      },
      body: JSON.stringify({
        message: error.message,
        stacktrace: error.stack,
        level: 'error',
      }),
    }).catch(() => {});
  } catch (err) {
    // Ignore Sentry failures
  }
}

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

const logger = {
  setLevel: (level) => {
    if (LEVELS.includes(level)) currentLevel = level;
  },
  debug: (...args) => {
    if (shouldLog('debug')) originalConsole.log(...args);
  },
  info: (...args) => {
    if (shouldLog('info')) originalConsole.info(...args);
  },
  warn: (...args) => {
    if (shouldLog('warn')) originalConsole.warn(...args);
  },
  error: (message, err) => {
    if (shouldLog('error')) originalConsole.error(message, err);
    const errorObj = err instanceof Error ? err : new Error(message);
    sendToSentry(errorObj);
  },
};

if (process.env.NODE_ENV === 'production') {
  logger.setLevel('warn');
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

console.warn = (...args) => logger.warn(...args);
console.error = (msg, ...args) => logger.error(msg, ...args);

export default logger;
