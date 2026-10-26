import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: '팀플에서 나는 무엇부터 할까? · What do I do first in a team?',
  description: 'BTM101 Kotter, What Leaders Really Do — classroom activity',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><Suspense>{children}</Suspense></body>
    </html>
  );
}
