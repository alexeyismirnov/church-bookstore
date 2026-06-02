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
- `npm run build` - Build the project for production
- `npm start` - Start the production server (after building)

## Project Structure

```
church-bookstore/
├── app/                    # Next.js App Router pages
│   ├── components/         # Reusable React components
│   ├── lib/                # Data and utilities
│   │   └── countries.json  # Static countries list for shipping
│   ├── types/              # TypeScript type definitions
│   ├── page.tsx            # Homepage
│   ├── catalog/            # Catalog page
│   ├── product/[id]/       # Product detail pages
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout page
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── about/              # About us page
│   ├── contact/            # Contact page
├── public/images/         # Static images (book covers, logo)
└── package.json            # Project dependencies
```

## Updating the Countries List

The countries list in [`app/lib/countries.json`](app/lib/countries.json:1) is pre-fetched from the django-oscar backend API and stored locally for instant loading (infinite caching). This allows the shipping country dropdown to load without waiting for an API request.

### When to Update

Update the countries list when:
- New countries are added to the django-oscar backend
- Existing countries' `is_shipping_country` values change
- Countries are added or removed from the system

### How to Update

1. **Fetch countries from the API** (paginated, 20 per page):

   ```bash
   curl -H "Authorization: Token YOUR_TOKEN" "https://orthodoxbookshop.asia/api/countries/?page=1"
   ```

2. **Process the response**: For each shipping country (`is_shipping_country=true`), extract:
   - `code`: The 2-letter ISO country code (from the URL field)
   - `name`: The `printable_name` field

3. **Combine all pages** and sort alphabetically by `name`

4. **Replace the contents** of [`app/lib/countries.json`](app/lib/countries.json:1) with the new sorted list

### Example API Response

```json
{
  "count": 50,
  "next": "https://orthodoxbookshop.asia/api/countries/?page=2",
  "results": [
    {
      "url": "https://orthodoxbookshop.asia/api/countries/CN/",
      "code": "CN",
      "name": "China",
      "printable_name": "China",
      "is_shipping_country": true
    }
  ]
}
```

### Note About Caching

Changes to `countries.json` won't take effect until the app is redeployed. The file is bundled at build time for optimal performance.

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

## Deployment

Production runs with `next start` behind nginx and managed by systemd.

### Initial setup (server)

1. Install dependencies and build:
   ```bash
   cd /home/bookshop/church-bookstore
   npm install
   npm run build
   ```

2. Create `/home/bookshop/church-bookstore/.env.production`:
   ```env
   NODE_ENV=production
   PORT=3000
   OSCAR_API_URL=https://django.orthodoxbookshop.asia/api
   NEXT_PUBLIC_MEDIA_BASE_URL=https://django.orthodoxbookshop.asia
   ```

3. Create a systemd service (example name: `church-bookstore.service`) with:
   - `WorkingDirectory=/home/bookshop/church-bookstore`
   - `EnvironmentFile=/home/bookshop/church-bookstore/.env.production`
   - `ExecStart=/usr/bin/npm run start`

4. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now church-bookstore
   ```

### Updating production after a code change (`git pull`)

Run these commands on the frontend VM:

```bash
cd /home/bookshop/church-bookstore
git pull
npm install
rm -rf .next
npm run build
sudo systemctl restart church-bookstore
```

### Verification after deploy

```bash
sudo systemctl status church-bookstore
curl -iL "http://127.0.0.1:3000/api/oscar/products?page=1"
```

If needed, inspect logs:

```bash
journalctl -u church-bookstore -n 100 --no-pager
```

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Lucide React (icons)
