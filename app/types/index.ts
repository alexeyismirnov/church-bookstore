export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  coverImage: string;
  category: string;
  publisher: string;
  year: number;
  pages: number;
  description: string;
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'popular';
}
