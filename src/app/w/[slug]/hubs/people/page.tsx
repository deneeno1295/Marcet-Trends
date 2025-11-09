import { auth } from '@clerk/nextjs';
import { prisma, setRLSContext } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default async function PeopleHubPage({
  params,
}: {
  params: { slug: string };
}) {
  const { userId } = auth();
  await setRLSContext(userId!);

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
  });

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  const people = await prisma.person.findMany({
    where: { workspaceId: workspace.id },
    include: {
      items: {
        include: {
          item: {
            select: {
              occurredAt: true,
            },
          },
        },
        orderBy: {
          item: {
            occurredAt: 'desc',
          },
        },
        take: 1,
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: {
      items: {
        _count: 'desc',
      },
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">People Hub</h1>
        <p className="text-muted-foreground">
          Track individuals and their insights across the workspace
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => {
          const initials = person.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();

          const lastActivity = person.items[0]?.item.occurredAt;

          return (
            <Link key={person.id} href={`/w/${params.slug}/hubs/people/${person.id}`}>
              <Card className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      {person.avatarUrl && <AvatarImage src={person.avatarUrl} />}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{person.name}</CardTitle>
                      {person.role && (
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                      )}
                      {person.org && (
                        <p className="text-xs text-muted-foreground">{person.org}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold">{person._count.items}</span>
                      <span className="text-muted-foreground"> insights</span>
                    </div>
                    {lastActivity && (
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(lastActivity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {people.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No people tracked yet. Add insights to start tracking people.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


