import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://eventloop-lab.vercel.app'),
  title: 'EventLoop Lab',
  description:
    'Analyze small JavaScript snippets and step through the call stack, Web APIs, microtask queue, macrotask queue, and event loop.',
  openGraph: {
    title: 'EventLoop Lab',
    description:
      'Visualize how JavaScript code moves through the call stack, Web APIs, queues, and event loop.',
    url: 'https://eventloop-lab.vercel.app',
    siteName: 'EventLoop Lab',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'EventLoop Lab JavaScript Runtime Visualizer',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EventLoop Lab',
    description: 'Visualize JavaScript runtime behaviour step by step.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
