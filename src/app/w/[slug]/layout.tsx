import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { prisma, setRLSContext } from '@/lib/db';
import WorkspaceNav from '@/components/workspace-nav';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/login');
  }

  // Set RLS context
  await setRLSContext(userId);

  // Verify workspace access
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
    include: {
      memberships: {
        where: { userId },
        include: { user: true },
      },
    },
  });

  if (!workspace || workspace.memberships.length === 0) {
    redirect('/');
  }

  const currentMembership = workspace.memberships[0];

  return (
    <div className="flex h-screen flex-col">
      <WorkspaceNav workspace={workspace} membership={currentMembership} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}


