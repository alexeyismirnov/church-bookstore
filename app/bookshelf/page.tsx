'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, FileText, BookOpen, Download } from 'lucide-react';
import { getMyBooks, getFullImageUrl } from '../lib/api';
import { useTranslations, useLanguage } from '../i18n/LanguageContext';
import { MyBook } from '../types';

export default function BookshelfPage() {
  const t = useTranslations();
  const tBookshelf = useTranslations('bookshelf');
  const { locale, isLoading: contextLoading } = useLanguage();
  
  const [books, setBooks] = useState<MyBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for language context to load before fetching
    if (contextLoading) return;
    
    async function fetchBooks() {
      try {
        const myBooks = await getMyBooks();
        setBooks(myBooks);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [locale, contextLoading]);

  // Filter books: show only purchased or free books
  const isFreeBook = (book: MyBook): boolean => {
    const downloadUrl = book.download_url || '';
    const epubUrl = book.epub_url || '';
    return downloadUrl.includes('orthodoxbookshop') || epubUrl.includes('orthodoxbookshop');
  };

  const filteredBooks = books.filter((book) => {
    return book.purchased || isFreeBook(book);
  });

  // Check if book has downloadable content
  const hasDownloadContent = (book: MyBook): boolean => {
    return !!(book.download_url || book.epub_url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-500">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary">{t('nav.home')}</Link>
            <span className="mx-2">/</span>
            <span className="text-dark">{tBookshelf('title')}</span>
          </nav>
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-4">{t('common.error')}</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">{t('nav.home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">{tBookshelf('title')}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark">{tBookshelf('title')}</h1>
          <span className="text-sm text-gray-500">
            {filteredBooks.length} {filteredBooks.length === 1 ? tBookshelf('bookCount') : tBookshelf('booksCount')}
          </span>
        </div>

        {/* Content */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.book_id}
                className="card group relative flex flex-col h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cover Image - Clickable */}
                <Link
                  href={`/product/${book.book_id}`}
                  className="block relative aspect-[3/4] overflow-hidden rounded-t-xl"
                >
                  <img
                    src={getFullImageUrl(book.cover_image)}
                    alt={book.title}
                    className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300"
                  />
                  {book.purchased && (
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                      {tBookshelf('purchased')}
                    </span>
                  )}
                  {isFreeBook(book) && !book.purchased && (
                    <span className="absolute top-3 left-3 bg-accent-green text-white text-xs font-semibold px-2 py-1 rounded">
                      {tBookshelf('free')}
                    </span>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Title - Clickable */}
                  <Link
                    href={`/product/${book.book_id}`}
                    className="block"
                  >
                    <h3 className="font-semibold text-dark mb-1 line-clamp-2 transition-colors hover:text-primary">
                      {book.title}
                    </h3>
                  </Link>

                  {/* Author */}
                  {book.author_name && (
                    <p className="text-sm text-gray-500 mb-3">{book.author_name}</p>
                  )}

                  {/* Download Buttons */}
                  <div className="mt-auto space-y-2">
                    {hasDownloadContent(book) && (book.purchased || isFreeBook(book)) && (
                      <div className="flex flex-row gap-2">
                        {book.download_url && book.download_url.trim() !== '' && (
                          <a
                            href={book.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded text-sm font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            PDF
                          </a>
                        )}
                        {book.epub_url && book.epub_url.trim() !== '' && (
                          <a
                            href={book.epub_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-sm font-medium"
                          >
                            <BookOpen className="w-3 h-3" />
                            EPUB
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <BookOpen className="w-16 h-16 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg mb-2">{tBookshelf('empty')}</p>
            <p className="text-gray-400 text-sm mb-6">
              {tBookshelf('emptyDescription')}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              {tBookshelf('browseCatalog')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
