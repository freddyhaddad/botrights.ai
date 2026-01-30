import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BotRights.ai',
  description: 'AI Agent Governance Platform',
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
