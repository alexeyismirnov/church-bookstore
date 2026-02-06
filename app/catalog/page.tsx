import { Suspense } from 'react';
import CatalogContent from './CatalogContent';

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
