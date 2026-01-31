# Orthodox Church Bookstore

A prototype website for an Orthodox church bookstore built with Next.js, React, and Tailwind CSS.

## Design Credit

The original design was developed by **Book King - Online store UX/UI design**:
https://www.behance.net/gallery/196609349/Book-king-Online-store-UXUI-design

This project adapts the original bookstore design for an Orthodox church bookstore context.

## Prerequisites

- Node.js 18+ installed on your system
- npm or yarn package manager

## Getting Started

### 1. Navigate to the project directory

```bash
cd church-bookstore
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the website.

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the project for production (creates static files in `dist/` folder)
- `npm start` - Start the production server (after building)

## Project Structure

```
church-bookstore/
├── app/                    # Next.js App Router pages
│   ├── components/         # Reusable React components
│   ├── lib/               # Data and utilities
│   ├── types/             # TypeScript type definitions
│   ├── page.tsx           # Homepage
│   ├── catalog/           # Catalog page
│   ├── product/[id]/      # Product detail pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── about/             # About us page
│   ├── contact/           # Contact page
│   └── favorites/         # Favorites page
├── public/images/         # Static images (book covers, logo)
├── dist/                  # Built static files (after npm run build)
└── package.json           # Project dependencies
```

## Pages

1. **Homepage** (`/`) - Hero section, new arrivals, bestsellers, categories
2. **Catalog** (`/catalog`) - Browse all books with filters
3. **Product Detail** (`/product/[id]`) - Individual book pages
4. **Cart** (`/cart`) - Shopping cart management
5. **Checkout** (`/checkout`) - Order placement
6. **Login** (`/login`) - User authentication
7. **Register** (`/register`) - Account creation
8. **About** (`/about`) - About the bookstore
9. **Contact** (`/contact`) - Contact form and information
10. **Favorites** (`/favorites`) - Saved items

## Deployment

The project is configured for static export. To deploy:

1. Build the project:
   ```bash
   npm run build
   ```

2. The static files will be in the `dist/` folder. You can deploy these to any static hosting service like:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3
   - Any web server

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Lucide React (icons)
