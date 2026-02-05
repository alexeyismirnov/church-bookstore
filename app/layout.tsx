import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { StripeProvider } from './providers/StripeProvider';

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
    <html lang="en">
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <StripeProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </StripeProvider>
      </body>
    </html>
  );
}
