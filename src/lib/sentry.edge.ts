import * as Sentry from '@sentry/nextjs';
import { env } from './env';

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false,
    environment: env.NODE_ENV,
  });
}


