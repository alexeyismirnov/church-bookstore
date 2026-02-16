// app/layout.tsx
// Updated to include LanguageProvider and dynamic locale handling

import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Providers from './components/Providers';
import LocaleHandler from './components/LocaleHandler';

export const metadata: Metadata = {
  title: 'Orthodox Church Bookstore',
  description: 'Your source for Orthodox Christian books, prayer books, and spiritual resources',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <LocaleHandler />
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
