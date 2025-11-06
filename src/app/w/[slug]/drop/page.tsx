'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Link as LinkIcon, FileText } from 'lucide-react';

export default function DropPage() {
  const params = useParams();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setPreview(null);

    try {
      const response = await fetch(`/api/w/${params.slug}/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest content');
      }

      setPreview(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/w/${params.slug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: preview.title,
          contentMd: preview.contentMd,
          summary: preview.summary,
          tags: preview.tags,
        }),
      });

      if (response.ok) {
        router.push(`/w/${params.slug}`);
      }
    } catch (err) {
      setError('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Drop Content</h1>
        <p className="text-muted-foreground">
          Paste a URL, text, or upload a file to ingest content into your workspace.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ingest Content</CardTitle>
          <CardDescription>
            Enter a URL to extract and analyze content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Ingest
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Review the extracted content before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Title</h3>
              <p>{preview.title}</p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Summary</h3>
              <p className="text-sm text-muted-foreground">{preview.summary}</p>
            </div>

            {preview.tags && preview.tags.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {preview.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 font-semibold">Content Preview</h3>
              <div className="max-h-60 overflow-y-auto rounded-md bg-muted p-4 text-sm">
                <pre className="whitespace-pre-wrap">{preview.contentMd.slice(0, 500)}...</pre>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                Confirm & Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPreview(null);
                  setUrl('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

