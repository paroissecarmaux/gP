const listeners = new Set();

export function onError(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportError(error, context) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  console.error('[gParoisse]', normalized, context ?? '');
  for (const listener of listeners) {
    listener(normalized, context);
  }
}

export function installGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, { source: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandledrejection' });
  });
}
