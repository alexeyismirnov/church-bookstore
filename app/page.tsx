import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import { books, getNewArrivals, getBestsellers } from './lib/data';

export default function HomePage() {
  const newArrivals = getNewArrivals();
  const bestsellers = getBestsellers();

  return (
    <div>
      <Hero />

      {/* New Arrivals Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">New Arrivals</h2>
            <Link
              href="/catalog?sort=newest"
              className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid books={newArrivals} />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: 'Prayer Books', image: '/images/products/2013/09/20060122prayerbook1.jpg', count: 24 },
              { name: 'Liturgical Books', image: '/images/products/2013/10/cabasilasliturgy.jpg', count: 18 },
              { name: 'Lives of Saints', image: '/images/products/2014/06/sergiy.jpg', count: 32 },
              { name: 'Theology', image: '/images/products/2014/07/pravoslavie.jpg', count: 28 },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/catalog?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group relative aspect-square rounded-xl overflow-hidden"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                  <p className="text-white/70 text-sm">{category.count} books</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">Bestsellers</h2>
            <Link
              href="/catalog?sort=popular"
              className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid books={bestsellers} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Curated Selection</h3>
              <p className="text-gray-600">
                Carefully selected books from Orthodox publishers worldwide, ensuring doctrinal soundness and spiritual value.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                All our books are printed on high-quality paper with durable bindings, built to last for generations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Church Supported</h3>
              <p className="text-gray-600">
                Proceeds support our parish ministries and charitable works in the local community and abroad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-300 mb-8">
            Subscribe to our newsletter for new arrivals, special offers, and spiritual reflections.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-4 py-3 rounded-lg text-dark"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
