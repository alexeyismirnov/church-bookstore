import Link from 'next/link';
import { Heart, Check, Truck, Shield, Minus, Plus, Download, FileText, BookOpen } from 'lucide-react';
import { getProductById, oscarProductToBook } from '../../lib/api';
import { Book } from '../../types';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function fetchBook(id: string): Promise<Book | null> {
  try {
    const product = await getProductById(id);
    return oscarProductToBook(product);
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return null;
  }
}


function DownloadButtons({ book }: { book: Book }) {
  // If all URLs are null/empty, don't show any download buttons
  if (!book.downloadUrl && !book.previewUrl && !book.epubUrl) {
    return null;
  }

  const isPaidBook = book.downloadUrl?.includes('orthodoxpaidbooks');
  const isFreeBook = book.downloadUrl?.includes('orthodoxbookshop');

  // Paid book: show only PDF preview button
  if (isPaidBook) {
    if (!book.previewUrl) return null;
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">Digital Version</span>
        <a
          href={book.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Preview PDF</span>
        </a>
        <p className="text-xs text-gray-500">
          This is a paid e-book. Preview available, purchase required for full download.
        </p>
      </div>
    );
  }

  // Free book from orthodoxbookshop: show PDF and EPUB buttons
  if (isFreeBook) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">Free Download</span>
        <div className="flex flex-wrap gap-3">
          {book.downloadUrl && (
            <a
              href={book.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          )}
          {book.epubUrl && (
            <a
              href={book.epubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download EPUB</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Unknown source with download URL: show generic download button
  if (book.downloadUrl) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">Download</span>
        <a
          href={book.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </a>
      </div>
    );
  }

  return null;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const book = await fetchBook(id);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark mb-4">Book Not Found</h1>
          <p className="text-gray-500 mb-6">The book you're looking for doesn't exist.</p>
          <Link href="/catalog" className="btn-primary">
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/catalog" className="hover:text-primary">Catalog</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">{book.title}</span>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-dark mb-4">
                {book.title}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-dark">
                ${book.price.toFixed(2)}
              </span>
              {book.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ${book.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {book.inStock ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">In Stock</span>
                </>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 border rounded-lg px-4 py-2 w-fit">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">1</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button className="btn-primary flex-grow">
                Add to Cart
              </button>
              <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-colors">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Download Buttons */}
            <DownloadButtons book={book} />

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Free shipping over $50</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Secure checkout</span>
              </div>
            </div>

            {/* Characteristics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-dark mb-4">Details</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Author</dt>
                  <dd className="font-medium text-dark">{book.author}</dd>
                </div>
                {book.translator && (
                  <div>
                    <dt className="text-gray-500">Translator</dt>
                    <dd className="font-medium text-dark">{book.translator}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Publisher</dt>
                  <dd className="font-medium text-dark">{book.publisher}</dd>
                </div>
                {book.pubDate && (
                  <div>
                    <dt className="text-gray-500">Publication date</dt>
                    <dd className="font-medium text-dark">{book.pubDate}</dd>
                  </div>
                )}
                {book.language && (
                  <div>
                    <dt className="text-gray-500">Language</dt>
                    <dd className="font-medium text-dark">{book.language}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Pages</dt>
                  <dd className="font-medium text-dark">{book.pages}</dd>
                </div>
              </dl>
              {book.description && (
                <div className="mt-6 pt-6 border-t">
                  <div
                    className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: book.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
