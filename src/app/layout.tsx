import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Insight Graph - Connect & Visualize Intelligence',
  description: 'Multi-tenant web app for ingesting, connecting, and visualizing insights across people, trends, and time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={cn(inter.className, 'min-h-screen antialiased')}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

