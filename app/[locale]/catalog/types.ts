import { Book } from '../../types';

export interface CatalogInitialData {
  books: Book[];
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  error: string | null;
  requestKey: string;
}

export interface CatalogContentSeoProps {
  listingTitle: string;
  categoryIntro?: string;
  categoryName?: string;
}
