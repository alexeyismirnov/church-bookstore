'use client';

import Image from 'next/image';
import { useState } from 'react';
import { isOptimizableImageUrl } from '../lib/images';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** width / height for fixed aspect product cards */
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export default function ProductImage({
  src,
  alt,
  className = '',
  width,
  height,
  fill,
  sizes,
  priority,
  onLoad,
}: ProductImageProps) {
  const [useFallback, setUseFallback] = useState(!isOptimizableImageUrl(src));

  if (useFallback) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src || '/images/placeholder-book.jpg'}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={onLoad}
        onError={() => setUseFallback(true)}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 768px) 80px, 25vw'}
        className={className}
        priority={priority}
        onLoad={onLoad}
        onLoadingComplete={onLoad}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 300}
      height={height ?? 400}
      sizes={sizes}
      className={className}
      priority={priority}
      onLoad={onLoad}
      onLoadingComplete={onLoad}
      onError={() => setUseFallback(true)}
    />
  );
}
