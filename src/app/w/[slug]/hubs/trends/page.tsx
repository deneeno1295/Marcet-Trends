import { auth } from '@clerk/nextjs';
import { prisma, setRLSContext } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function TrendsHubPage({
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

  const trends = await prisma.trend.findMany({
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
        <h1 className="text-3xl font-bold">Trends Hub</h1>
        <p className="text-muted-foreground">
          Track macro trends and emerging themes across insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trends.map((trend) => {
          const lastActivity = trend.items[0]?.item.occurredAt;
          const colorClass = trend.color
            ? `bg-[${trend.color}]`
            : 'bg-gradient-to-br from-blue-500 to-purple-600';

          return (
            <Link key={trend.id} href={`/w/${params.slug}/hubs/trends/${trend.id}`}>
              <Card className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-white ${colorClass}`}>
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{trend.name}</CardTitle>
                      {trend.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {trend.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold">{trend._count.items}</span>
                      <span className="text-muted-foreground"> mentions</span>
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

        {trends.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No trends tracked yet. Add insights to start tracking trends.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

