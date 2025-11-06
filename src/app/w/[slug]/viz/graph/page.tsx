'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import cola from 'cytoscape-cola';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// Register layout
if (typeof window !== 'undefined') {
  cytoscape.use(cola);
}

export default function GraphVisualizationPage() {
  const params = useParams();
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const loadGraph = async () => {
      try {
        // Fetch items and links
        const [itemsRes, linksRes] = await Promise.all([
          fetch(`/api/w/${params.slug}/items`),
          fetch(`/api/w/${params.slug}/links`),
        ]);

        const items = await itemsRes.json();
        const links = await linksRes.json();

        // Convert to Cytoscape elements
        const nodes: ElementDefinition[] = items.slice(0, 100).map((item: any) => ({
          data: {
            id: item.id,
            label: item.title,
            score: item.score,
            summary: item.summary,
            tags: item.tags?.map((t: any) => t.tag.name) || [],
          },
        }));

        const edges: ElementDefinition[] = links
          .filter((link: any) => 
            nodes.some(n => n.data.id === link.fromItemId) &&
            nodes.some(n => n.data.id === link.toItemId)
          )
          .map((link: any) => ({
            data: {
              id: link.id,
              source: link.fromItemId,
              target: link.toItemId,
              label: link.relation,
              weight: link.weight,
            },
          }));

        setStats({ nodes: nodes.length, edges: edges.length });

        // Initialize Cytoscape
        if (cyRef.current) {
          cyRef.current.destroy();
        }

        const cy = cytoscape({
          container: containerRef.current,
          elements: [...nodes, ...edges],
          style: [
            {
              selector: 'node',
              style: {
                'background-color': (ele) => {
                  const score = ele.data('score') || 0;
                  return score > 15 ? '#3b82f6' : score > 10 ? '#6366f1' : '#94a3b8';
                },
                'label': 'data(label)',
                'width': (ele) => Math.max(30, (ele.data('score') || 5) * 2),
                'height': (ele) => Math.max(30, (ele.data('score') || 5) * 2),
                'font-size': '10px',
                'text-wrap': 'wrap',
                'text-max-width': '80px',
                'color': '#1e293b',
                'text-valign': 'bottom',
                'text-margin-y': '5px',
              },
            },
            {
              selector: 'edge',
              style: {
                'width': (ele) => ele.data('weight') || 1,
                'line-color': '#cbd5e1',
                'target-arrow-color': '#cbd5e1',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '8px',
                'text-rotation': 'autorotate',
                'color': '#64748b',
              },
            },
            {
              selector: 'node:selected',
              style: {
                'border-width': 3,
                'border-color': '#ef4444',
              },
            },
          ],
          layout: {
            name: 'cola',
            animate: true,
            maxSimulationTime: 3000,
            nodeSpacing: 50,
            edgeLength: 100,
          } as any,
          minZoom: 0.3,
          maxZoom: 3,
          wheelSensitivity: 0.2,
        });

        // Event handlers
        cy.on('tap', 'node', (evt) => {
          const node = evt.target;
          setSelectedNode({
            id: node.id(),
            label: node.data('label'),
            score: node.data('score'),
            summary: node.data('summary'),
            tags: node.data('tags'),
          });
        });

        cy.on('tap', (evt) => {
          if (evt.target === cy) {
            setSelectedNode(null);
          }
        });

        cyRef.current = cy;
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load graph:', error);
        setIsLoading(false);
      }
    };

    loadGraph();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [params.slug]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFitView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Graph Canvas */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
        
        {/* Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button size="icon" variant="secondary" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleFitView}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="absolute right-4 top-4">
          <Card className="p-4">
            <div className="text-sm">
              <div className="font-semibold">Graph Stats</div>
              <div className="mt-2 text-muted-foreground">
                Nodes: {stats.nodes}
              </div>
              <div className="text-muted-foreground">
                Edges: {stats.edges}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sidebar */}
      {selectedNode && (
        <div className="w-80 border-l bg-background p-4">
          <h2 className="mb-4 text-xl font-bold">Node Details</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Title</h3>
              <p className="text-sm">{selectedNode.label}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Score</h3>
              <p className="text-sm">{selectedNode.score}</p>
            </div>

            {selectedNode.summary && (
              <div>
                <h3 className="font-semibold">Summary</h3>
                <p className="text-sm text-muted-foreground">{selectedNode.summary}</p>
              </div>
            )}

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

