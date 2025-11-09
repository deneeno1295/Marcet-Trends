import * as Sentry from '@sentry/nextjs';
import { env } from './env';

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    environment: env.NODE_ENV,
    
    // Enable performance monitoring
    integrations: [
      new Sentry.Integrations.Prisma({ client: undefined }),
    ],
    
    // Optionally capture 100% of transactions for performance monitoring
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}


