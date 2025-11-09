import { auth } from '@clerk/nextjs';
import { prisma, setRLSContext } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { TrendingUp, Users, FileText, Link as LinkIcon } from 'lucide-react';

export default async function WorkspaceHomePage({
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

  // Get recent items
  const recentItems = await prisma.item.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      tags: {
        include: { tag: true },
      },
      people: {
        include: { person: true },
      },
      trends: {
        include: { trend: true },
      },
    },
  });

  // Get stats
  const stats = await Promise.all([
    prisma.item.count({ where: { workspaceId: workspace.id } }),
    prisma.link.count({ where: { workspaceId: workspace.id } }),
    prisma.person.count({ where: { workspaceId: workspace.id } }),
    prisma.trend.count({ where: { workspaceId: workspace.id } }),
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{workspace.name}</h1>
        <p className="text-muted-foreground">
          Welcome back. Here's what's happening in your workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[2]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trends</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[3]}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
          <CardDescription>Latest items added to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  {item.summary && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.summary.slice(0, 150)}
                      {item.summary.length > 150 ? '...' : ''}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tagRel) => (
                      <Badge key={tagRel.tagId} variant="secondary">
                        {tagRel.tag.name}
                      </Badge>
                    ))}
                    {item.people.slice(0, 2).map((personRel) => (
                      <Badge key={personRel.personId} variant="outline">
                        {personRel.person.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="ml-4 text-sm text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </div>
              </div>
            ))}
            {recentItems.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No items yet. Start by ingesting some content!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


