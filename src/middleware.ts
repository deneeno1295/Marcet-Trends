import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ['/login', '/signup', '/api/webhooks/(.*)'],
  
  // Ignore API routes that have their own auth
  ignoredRoutes: ['/api/inngest', '/monitoring'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

