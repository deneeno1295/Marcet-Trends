import { auth } from '@clerk/nextjs';
import { prisma, setRLSContext } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default async function PersonDetailPage({
  params,
}: {
  params: { slug: string; personId: string };
}) {
  const { userId } = auth();
  await setRLSContext(userId!);

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
  });

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  const person = await prisma.person.findUnique({
    where: { id: params.personId },
    include: {
      items: {
        include: {
          item: {
            include: {
              tags: {
                include: { tag: true },
              },
              trends: {
                include: { trend: true },
              },
            },
          },
        },
        orderBy: {
          item: {
            occurredAt: 'desc',
          },
        },
        take: 20,
      },
    },
  });

  if (!person) {
    return <div>Person not found</div>;
  }

  // Calculate momentum (items in last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentItems = person.items.filter(
    (rel) => new Date(rel.item.occurredAt) >= fourWeeksAgo
  );
  const momentum = recentItems.length;

  // Find contradictions (items with contradicts relation)
  const contradictions = await prisma.link.findMany({
    where: {
      workspaceId: workspace.id,
      relation: 'contradicts',
      OR: [
        { from: { people: { some: { personId: person.id } } } },
        { to: { people: { some: { personId: person.id } } } },
      ],
    },
    include: {
      from: true,
      to: true,
    },
    take: 5,
  });

  // Top claims (highest scored items)
  const topClaims = person.items
    .sort((a, b) => b.item.score - a.item.score)
    .slice(0, 5);

  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              {person.avatarUrl && <AvatarImage src={person.avatarUrl} />}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl">{person.name}</CardTitle>
              {person.role && (
                <p className="mt-1 text-lg text-muted-foreground">{person.role}</p>
              )}
              {person.org && (
                <p className="text-sm text-muted-foreground">{person.org}</p>
              )}
              {person.bio && (
                <p className="mt-4 text-sm">{person.bio}</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Momentum */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Momentum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{momentum}</div>
            <p className="text-sm text-muted-foreground">insights in last 4 weeks</p>
          </CardContent>
        </Card>

        {/* Total Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Total Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{person.items.length}</div>
            <p className="text-sm text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        {/* Contradictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Contradictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contradictions.length}</div>
            <p className="text-sm text-muted-foreground">conflicting insights</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Claims */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top Claims</CardTitle>
          <CardDescription>Highest scoring insights from this person</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClaims.map((rel) => (
              <div key={rel.item.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{rel.item.title}</h3>
                    {rel.item.summary && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {rel.item.summary}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rel.item.tags.slice(0, 3).map((tagRel) => (
                        <Badge key={tagRel.tagId} variant="secondary" className="text-xs">
                          {tagRel.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 text-sm">
                    <div className="font-semibold">Score: {rel.item.score}</div>
                    <div className="text-muted-foreground">
                      {formatRelativeTime(rel.item.occurredAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest insights from this person</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {person.items.slice(0, 10).map((rel) => (
              <div key={rel.item.id} className="border-b pb-4 last:border-0 last:pb-0">
                <h3 className="font-medium">{rel.item.title}</h3>
                {rel.item.summary && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rel.item.summary.slice(0, 150)}
                    {rel.item.summary.length > 150 ? '...' : ''}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {rel.item.tags.slice(0, 3).map((tagRel) => (
                      <Badge key={tagRel.tagId} variant="secondary" className="text-xs">
                        {tagRel.tag.name}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(rel.item.occurredAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contradictions Detail */}
      {contradictions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contradictions</CardTitle>
            <CardDescription>Conflicting or opposing insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contradictions.map((link) => (
                <div key={link.id} className="rounded-md border p-4">
                  <div className="mb-2">
                    <Badge variant="destructive">Contradicts</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium">{link.from.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {link.from.summary?.slice(0, 100)}...
                      </p>
                    </div>
                    <div className="border-t pt-2">
                      <h4 className="font-medium">{link.to.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {link.to.summary?.slice(0, 100)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


