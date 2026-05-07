'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { useTranslations } from '../i18n/LanguageContext';
import { useCurrency } from '../i18n/CurrencyContext';

interface CartItemDisplay {
  id: string;
  basketLineId?: number;
  title: string;
  author?: string;
  price: number;
  quantity: number;
  coverImage: string;
  linePrice?: number;
  variantTitle?: string;
  parentId?: string; // Parent product ID for navigation
}

interface CartItemProps {
  item: CartItemDisplay;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onUpdateQuantityByDelta?: (delta: number) => void;
  onRemove?: (id: string) => void;
  onRemoveByBasketLineId?: (basketLineId: number) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onUpdateQuantityByDelta,
  onRemove,
  onRemoveByBasketLineId
}: CartItemProps) {
  const t = useTranslations();
  const { symbol } = useCurrency();
  
  // Use parentId for navigation if available (for variants), otherwise use item.id
  const productLinkId = item.parentId || item.id;
  
  const handleDecrease = () => {
    if (onUpdateQuantityByDelta) {
      onUpdateQuantityByDelta(-1);
    } else if (onUpdateQuantity) {
      onUpdateQuantity(item.id, Math.max(1, item.quantity - 1));
    }
  };

  const handleIncrease = () => {
    if (onUpdateQuantityByDelta) {
      onUpdateQuantityByDelta(1);
    } else if (onUpdateQuantity) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleRemove = () => {
    if (onRemoveByBasketLineId && item.basketLineId) {
      onRemoveByBasketLineId(item.basketLineId);
    } else if (onRemove) {
      onRemove(item.id);
    }
  };

  return (
    <div className="flex gap-4 py-6 px-6 border-b border-gray-100">
      {/* Image */}
      <div className="w-24 h-32 flex-shrink-0">
        <Link href={`/product/${productLinkId}`} className="block cursor-pointer">
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/product/${productLinkId}`} className="hover:underline cursor-pointer">
              <h3 className="font-semibold text-dark text-lg hover:text-burgundy transition-colors">{item.title}</h3>
            </Link>
            {item.variantTitle && <p className="text-sm text-gray-400 italic">({item.variantTitle})</p>}
            {item.author && <p className="text-sm text-gray-500">{item.author}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-dark">
              {symbol}{(item.linePrice ?? (item.price * item.quantity)).toFixed(2)}
            </p>
            {item.quantity > 1 && (
              <p className="text-sm text-gray-400">
                {symbol}{item.price.toFixed(2)} {t('cart.item.each')}
              </p>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrease}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={handleIncrease}
              className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemove}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
