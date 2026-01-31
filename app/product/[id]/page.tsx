import Link from 'next/link';
import { Heart, Star, Check, Truck, Shield, Minus, Plus } from 'lucide-react';
import { getBookById, getRelatedBooks, reviews, books } from '../../lib/data';
import ReviewCard from '../../components/ReviewCard';
import ProductGrid from '../../components/ProductGrid';

export function generateStaticParams() {
  return books.map((book) => ({
    id: book.id,
  }));
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const book = getBookById(id);
  
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

  const relatedBooks = getRelatedBooks(book.id);

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
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-dark mb-4">
                {book.title}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">{book.rating}</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{book.reviewCount} reviews</span>
              </div>
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

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {book.description}
            </p>

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
                <div>
                  <dt className="text-gray-500">Publisher</dt>
                  <dd className="font-medium text-dark">{book.publisher}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Year</dt>
                  <dd className="font-medium text-dark">{book.year}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Pages</dt>
                  <dd className="font-medium text-dark">{book.pages}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd className="font-medium text-dark">{book.category}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mb-16">
          <h2 className="section-title">Customer Reviews ({reviews.length})</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section>
            <h2 className="section-title">You May Also Like</h2>
            <ProductGrid books={relatedBooks} />
          </section>
        )}
      </div>
    </div>
  );
}
