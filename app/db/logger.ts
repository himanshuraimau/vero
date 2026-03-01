const PREFIX = '[Vero DB]';

export const dbLog = {
  info: (msg: string, data?: unknown) => {
    if (__DEV__) {
      console.log(`${PREFIX} ${msg}`, data !== undefined ? data : '');
    }
  },
  error: (msg: string, err: unknown) => {
    console.error(`${PREFIX} ERROR: ${msg}`, err);
    if (err instanceof Error) {
      console.error(`${PREFIX} message:`, err.message);
      console.error(`${PREFIX} stack:`, err.stack);
    }
  },
  warn: (msg: string, data?: unknown) => {
    if (__DEV__) {
      console.warn(`${PREFIX} WARN: ${msg}`, data !== undefined ? data : '');
    }
  },
};
