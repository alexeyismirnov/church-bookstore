'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, BookOpen, Download, Trash2 } from 'lucide-react';
import { getMyBooks, deleteMyBook, getFullImageUrl, transformToSpacesUrl } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useTranslations, useLanguage } from '../i18n/LanguageContext';
import { MyBook } from '../types';

export default function BookshelfPage() {
  const router = useRouter();
  const t = useTranslations();
  const tBookshelf = useTranslations('bookshelf');
  const { locale, isLoading: contextLoading } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [books, setBooks] = useState<MyBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [bookToDelete, setBookToDelete] = useState<{ bookId: number; title: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // Wait for language context and auth to load before fetching
    if (contextLoading) return;
    if (!isAuthenticated) return;
    
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
  }, [locale, contextLoading, isAuthenticated]);

  const handleDeleteBook = async (bookId: number) => {
    if (deletingBookId === bookId) return; // Already deleting
    setDeletingBookId(bookId);
    try {
      await deleteMyBook(bookId);
      setBooks(prev => prev.filter(b => b.book_id !== bookId));
      setBookToDelete(null); // Close dialog on success
    } catch (error) {
      console.error('Failed to delete book:', error);
    } finally {
      setDeletingBookId(null);
    }
  };

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

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
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
            <Link href="/" className="hover:text-burgundy">{t('nav.home')}</Link>
            <span className="mx-2">/</span>
            <span className="text-dark">{tBookshelf('title')}</span>
          </nav>
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-4">{t('common.error')}</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-burgundy hover:underline"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-burgundy to-burgundy-dark py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-parchment font-display">{tBookshelf('title')}</h1>
          <p className="text-xl text-parchment/70 max-w-3xl mx-auto">{tBookshelf('subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.book_id}
                className="card group relative flex flex-row sm:flex-col h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBookToDelete({ bookId: book.book_id, title: book.title });
                  }}
                  disabled={deletingBookId === book.book_id}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                  title={tBookshelf('removeFromBookshelf')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {/* Cover Image - Clickable */}
                <Link
                  href={`/product/${book.book_id}`}
                  className="relative w-20 sm:w-full h-28 sm:h-auto sm:aspect-[3/4] overflow-hidden rounded-lg sm:rounded-t-xl flex-shrink-0"
                >
                  <img
                    src={getFullImageUrl(book.cover_image)}
                    alt={book.title}
                    className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300"
                  />
                  {isFreeBook(book) && !book.purchased && (
                    <span className="absolute top-1 left-1 sm:top-3 sm:left-3 bg-accent-green text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      {tBookshelf('free')}
                    </span>
                  )}
                </Link>

                {/* Content */}
                <div className="p-3 sm:p-4 flex flex-col flex-grow min-w-0">
                  {/* Title - Clickable */}
                  <Link
                    href={`/product/${book.book_id}`}
                    className="block"
                  >
                    <h3 className="font-semibold text-dark mb-1 line-clamp-2 transition-colors hover:text-burgundy">
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
                            href={transformToSpacesUrl(book.download_url) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gold text-ink hover:bg-gold-light rounded-lg font-medium text-sm sm:text-base transition-colors duration-200 active:scale-95 transform"
                          >
                            <FileText className="w-3 h-3" />
                            PDF
                          </a>
                        )}
                        {book.epub_url && book.epub_url.trim() !== '' && (
                          <a
                            href={transformToSpacesUrl(book.epub_url) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gold text-ink hover:bg-gold-light rounded-lg font-medium text-sm sm:text-base transition-colors duration-200 active:scale-95 transform"
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-lg font-medium hover:bg-gold-light transition-colors duration-200 active:scale-95 transform"
              >
                <Download className="w-4 h-4" />
                {tBookshelf('browseCatalog')}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setBookToDelete(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 mx-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-dark mb-2">
              {tBookshelf('confirmDeleteTitle')}
            </h3>
            <p className="text-gray-600 mb-6">
              {tBookshelf('confirmDeleteMessage', { title: bookToDelete.title })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                {tBookshelf('cancel')}
              </button>
              <button
                onClick={() => handleDeleteBook(bookToDelete.bookId)}
                disabled={deletingBookId === bookToDelete.bookId}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingBookId === bookToDelete.bookId ? tBookshelf('deleting') : tBookshelf('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
