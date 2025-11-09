import { auth } from '@clerk/nextjs';
import { prisma, setRLSContext } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default async function TrendDetailPage({
  params,
}: {
  params: { slug: string; trendId: string };
}) {
  const { userId } = auth();
  await setRLSContext(userId!);

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
  });

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  const trend = await prisma.trend.findUnique({
    where: { id: params.trendId },
    include: {
      items: {
        include: {
          item: {
            include: {
              tags: {
                include: { tag: true },
              },
              people: {
                include: { person: true },
              },
            },
          },
        },
        orderBy: {
          momentum: 'desc',
        },
      },
    },
  });

  if (!trend) {
    return <div>Trend not found</div>;
  }

  // Calculate momentum (items in last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentItems = trend.items.filter(
    (rel) => new Date(rel.item.occurredAt) >= fourWeeksAgo
  );
  const momentum = recentItems.length;

  // Calculate momentum by week for sparkline data
  const weeklyMomentum = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (4 - i) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7);
    
    return trend.items.filter((rel) => {
      const date = new Date(rel.item.occurredAt);
      return date >= weekStart && date < weekEnd;
    }).length;
  });

  // Top insights
  const topInsights = trend.items
    .sort((a, b) => b.item.score - a.item.score)
    .slice(0, 10);

  // Find contradictions
  const contradictions = await prisma.link.findMany({
    where: {
      workspaceId: workspace.id,
      relation: 'contradicts',
      OR: [
        { from: { trends: { some: { trendId: trend.id } } } },
        { to: { trends: { some: { trendId: trend.id } } } },
      ],
    },
    include: {
      from: true,
      to: true,
    },
    take: 5,
  });

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white`}>
              <TrendingUp className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl">{trend.name}</CardTitle>
              {trend.description && (
                <p className="mt-2 text-muted-foreground">{trend.description}</p>
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
            <p className="text-sm text-muted-foreground">mentions in last 4 weeks</p>
            {/* Simple sparkline */}
            <div className="mt-4 flex items-end gap-1">
              {weeklyMomentum.map((count, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary"
                  style={{
                    height: `${Math.max(20, (count / Math.max(...weeklyMomentum)) * 60)}px`,
                  }}
                  title={`Week ${i + 1}: ${count} mentions`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Mentions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Total Mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trend.items.length}</div>
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

      {/* Top Insights */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top Insights</CardTitle>
          <CardDescription>Highest scoring insights related to this trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topInsights.map((rel) => (
              <div key={rel.item.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{rel.item.title}</h3>
                    {rel.item.summary && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {rel.item.summary.slice(0, 150)}
                        {rel.item.summary.length > 150 ? '...' : ''}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rel.item.tags.slice(0, 3).map((tagRel) => (
                        <Badge key={tagRel.tagId} variant="secondary" className="text-xs">
                          {tagRel.tag.name}
                        </Badge>
                      ))}
                      {rel.item.people.slice(0, 2).map((personRel) => (
                        <Badge key={personRel.personId} variant="outline" className="text-xs">
                          {personRel.person.name}
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

      {/* Contradictions Detail */}
      {contradictions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contradictions</CardTitle>
            <CardDescription>Conflicting or opposing insights within this trend</CardDescription>
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


