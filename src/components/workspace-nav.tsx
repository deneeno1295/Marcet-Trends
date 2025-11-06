'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  Network,
  Calendar,
  Users,
  TrendingUp,
  Mail,
  Settings,
} from 'lucide-react';

interface WorkspaceNavProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    role: string;
  };
}

export default function WorkspaceNav({ workspace, membership }: WorkspaceNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      href: `/w/${workspace.slug}`,
      icon: LayoutDashboard,
    },
    {
      label: 'Drop',
      href: `/w/${workspace.slug}/drop`,
      icon: Upload,
    },
    {
      label: 'Graph',
      href: `/w/${workspace.slug}/viz/graph`,
      icon: Network,
    },
    {
      label: 'Timeline',
      href: `/w/${workspace.slug}/viz/timeline`,
      icon: Calendar,
    },
    {
      label: 'People',
      href: `/w/${workspace.slug}/hubs/people`,
      icon: Users,
    },
    {
      label: 'Trends',
      href: `/w/${workspace.slug}/hubs/trends`,
      icon: TrendingUp,
    },
    {
      label: 'Newsletters',
      href: `/w/${workspace.slug}/newsletters`,
      icon: Mail,
    },
    {
      label: 'Settings',
      href: `/w/${workspace.slug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={`/w/${workspace.slug}`} className="text-xl font-bold">
            {workspace.name}
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </nav>
  );
}

