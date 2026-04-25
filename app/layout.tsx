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
  openGraph: {
    title: title,
    description: description,
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-soc-bg min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
