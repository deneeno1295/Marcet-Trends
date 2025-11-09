import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function HomePage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/login');
  }

  // Find user's first workspace and redirect
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  });

  if (membership) {
    redirect(`/w/${membership.workspace.slug}`);
  }

  // No workspaces found, redirect to onboarding
  redirect('/onboarding');
}


