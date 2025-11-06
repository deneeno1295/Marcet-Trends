'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Mail, Calendar, Download } from 'lucide-react';
import Link from 'next/link';

export default function NewslettersPage() {
  const params = useParams();
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNewsletters = async () => {
      try {
        const response = await fetch(`/api/w/${params.slug}/newsletters`);
        const data = await response.json();
        setNewsletters(data);
      } catch (error) {
        console.error('Failed to load newsletters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNewsletters();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletters</h1>
          <p className="text-muted-foreground">
            Generate and manage executive-ready digests
          </p>
        </div>
        <Link href={`/w/${params.slug}/newsletters/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Newsletter
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {newsletters.map((newsletter) => (
          <Card key={newsletter.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {newsletter.title}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(newsletter.periodStart).toLocaleDateString()} -{' '}
                      {new Date(newsletter.periodEnd).toLocaleDateString()}
                    </span>
                    <Badge variant="outline">{newsletter.cadence}</Badge>
                    <Badge variant="secondary">{newsletter.audience}</Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href={`/w/${params.slug}/newsletters/${newsletter.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {newsletter.meta?.itemsCount && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {newsletter.meta.itemsCount} insights included
                </p>
              </CardContent>
            )}
          </Card>
        ))}

        {newsletters.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                No newsletters yet. Create your first digest!
              </p>
              <Link href={`/w/${params.slug}/newsletters/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Newsletter
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

