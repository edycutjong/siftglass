import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';

const title = 'SIFT.Glass — AI-Powered Incident Response Dashboard';
const description =
  'OpenClaw-powered IR agent with live React Flow attack graph visualization. Watch AI investigate, self-correct, and reconstruct kill chains in real time.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  keywords: [
    'SIFT', 'incident response', 'DFIR', 'attack graph', 'threat hunting',
    'AI agent', 'MCP', 'SANS', 'Find Evil', 'cybersecurity', 'OpenClaw',
  ],
  authors: [{ name: 'SIFT.Glass Team' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: title,
    description: description,
    type: 'website',
    siteName: 'SIFT.Glass',
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-soc-bg min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
