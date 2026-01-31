import ProductCard from './ProductCard';
import { Book } from '../types';

interface ProductGridProps {
  books: Book[];
  columns?: 2 | 3 | 4 | 5;
}

export default function ProductGrid({ books, columns = 4 }: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {books.map((book) => (
        <ProductCard key={book.id} book={book} />
      ))}
    </div>
  );
}
