// app/product/[id]/page.tsx
// Product detail page - uses client component for localization

import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  return <ProductDetailClient productId={id} />;
}
