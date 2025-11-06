// Sentry instrumentation for Next.js
// This file is automatically loaded by Next.js when instrumentation is enabled
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/sentry.server');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./lib/sentry.edge');
  }
}

