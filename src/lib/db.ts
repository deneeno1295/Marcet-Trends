import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Set the current user ID for RLS policies
 * This should be called in API routes or server actions with the authenticated user's ID
 */
export async function setRLSContext(userId: string) {
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
}

/**
 * Clear the RLS context (optional, useful for cleanup)
 */
export async function clearRLSContext() {
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
}

export default prisma;


