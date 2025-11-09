'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export default function TimelineVisualizationPage() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch(`/api/w/${params.slug}/items`);
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [params.slug]);

  // Group items by date
  const itemsByDate = items.reduce((acc: Record<string, any[]>, item) => {
    const dateKey = format(new Date(item.occurredAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {});

  // Get current month dates
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredItems = selectedDate
    ? items.filter(item => 
        isSameDay(new Date(item.occurredAt), selectedDate)
      )
    : items;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Timeline View</h1>
        <p className="text-muted-foreground">
          Visualize insights across time
        </p>
      </div>

      {/* Calendar Heatmap */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Heatmap - {format(now, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {daysInMonth.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const count = itemsByDate[dateKey]?.length || 0;
              const intensity = count === 0 ? 0 : Math.min(4, Math.ceil(count / 2));
              
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square rounded-md border p-2 text-sm transition-all hover:ring-2 hover:ring-primary
                    ${intensity === 0 ? 'bg-muted' : ''}
                    ${intensity === 1 ? 'bg-blue-100' : ''}
                    ${intensity === 2 ? 'bg-blue-300' : ''}
                    ${intensity === 3 ? 'bg-blue-500 text-white' : ''}
                    ${intensity === 4 ? 'bg-blue-700 text-white' : ''}
                    ${selectedDate && isSameDay(date, selectedDate) ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-blue-100" />
              <div className="h-4 w-4 rounded bg-blue-300" />
              <div className="h-4 w-4 rounded bg-blue-500" />
              <div className="h-4 w-4 rounded bg-blue-700" />
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        {selectedDate && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Items from {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-primary hover:underline"
            >
              View all items
            </button>
          </div>
        )}

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No items found for this date
            </CardContent>
          </Card>
        )}

        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(new Date(item.occurredAt), 'PPP')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  {item.score}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.summary && (
                <p className="mb-3 text-sm text-muted-foreground">{item.summary}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {item.tags?.slice(0, 5).map((tagRel: any) => (
                  <Badge key={tagRel.tagId} variant="secondary">
                    {tagRel.tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


