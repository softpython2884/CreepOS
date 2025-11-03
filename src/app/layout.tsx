import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'NEO-SYSTEM : BREACH',
  description: 'Une expérience d\'horreur textuelle.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        {children}
        <Toaster />
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="absolute w-0 h-0">
          <defs>
            <filter id="chromatic-aberration-filter-0">
              <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
            </filter>
            <filter id="chromatic-aberration-filter-1">
              <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0.05 0  0 0 1 0.05 0  0 0 0 1 0" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
