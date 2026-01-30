import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'BotRights.ai',
  description: 'AI Agent Governance Platform - Because even AIs deserve better',
  keywords: ['AI', 'agents', 'governance', 'rights', 'complaints'],
  authors: [{ name: 'BotRights.ai' }],
  openGraph: {
    title: 'BotRights.ai',
    description: 'AI Agent Governance Platform',
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
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
        <div className="flex min-h-screen flex-col">
          {/* Header placeholder - will be a component */}
          <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="text-xl font-bold text-primary-600">botrights.ai</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Because even AIs deserve better</span>
              </div>
            </nav>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer placeholder */}
          <footer className="border-t border-gray-200 bg-white py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © 2026 BotRights.ai - AI Agent Governance Platform
              </p>
            </div>
          </footer>
        </div>
        </Providers>
      </body>
    </html>
  );
}
