import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'A Pinch of Pearl',
  description: 'Warm recipes made with love — from my kitchen to yours.',
  openGraph: {
    title: 'A Pinch of Pearl',
    description: 'Warm recipes made with love — from my kitchen to yours.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
