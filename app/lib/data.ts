import { Category } from '@/app/types';

/**
 * Static category data for the homepage.
 * Category names are localized via i18n — see "categoryNames" keys in locale files.
 * The "language" category (id: 6) is excluded here since it's filtered out on the homepage.
 * 
 * Note: product counts are not included since the homepage doesn't display them.
 * The FilterSidebar on the catalog page still fetches categories from the API
 * to get up-to-date product counts.
 */

interface StaticCategory {
  id: string;
  slug: string;
  nameKey: string;  // i18n translation key under "categoryNames"
  children: StaticCategoryChild[];
}

interface StaticCategoryChild {
  id: string;
  slug: string;
  nameKey: string;  // i18n translation key under "categoryNames"
}

export const STATIC_CATEGORIES: StaticCategory[] = [
  {
    id: "1",
    slug: "books",
    nameKey: "categoryNames.books",
    children: [
      { id: "59", slug: "books/e-books", nameKey: "categoryNames.ebooks" },
      { id: "5", slug: "books/lives-of-the-saints", nameKey: "categoryNames.livesOfSaints" },
      { id: "4", slug: "books/liturgical-books", nameKey: "categoryNames.liturgicalBooks" },
      { id: "3", slug: "books/theology", nameKey: "categoryNames.theology" },
      { id: "2", slug: "books/history-of-church", nameKey: "categoryNames.historyOfChurch" },
      { id: "55", slug: "books/for-beginners", nameKey: "categoryNames.forBeginners" },
      { id: "56", slug: "books/iconography", nameKey: "categoryNames.iconography" },
      { id: "61", slug: "parish-bulletin", nameKey: "categoryNames.parishBulletin" },
    ],
  },
  {
    id: "57",
    slug: "audiovideo",
    nameKey: "categoryNames.audiovideo",
    children: [
      { id: "60", slug: "audiovideo/audio", nameKey: "categoryNames.audio" },
      { id: "58", slug: "audiovideo/movies", nameKey: "categoryNames.movies" },
    ],
  },
  {
    id: "62",
    slug: "church-supplies",
    nameKey: "categoryNames.churchSupplies",
    children: [
      { id: "64", slug: "church-supplies/ikony", nameKey: "categoryNames.icons" },
      { id: "63", slug: "church-supplies/frankincense", nameKey: "categoryNames.frankincense" },
    ],
  },
];
