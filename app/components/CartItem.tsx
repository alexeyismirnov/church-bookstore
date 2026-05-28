'use client';

import LocalizedLink from './LocalizedLink';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { LocalCartItem } from '../lib/localCart';
import { useTranslations } from '../i18n/LanguageContext';
import { useCurrency } from '../i18n/CurrencyContext';
import { buildProductSlug } from '../lib/product-slug';

interface CartItemProps {
  item: LocalCartItem;
  onUpdateQuantity?: (productId: number, quantity: number) => void;
  onUpdateQuantityByDelta?: (delta: number) => void;
  onRemove?: (productId: number) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onUpdateQuantityByDelta,
  onRemove,
}: CartItemProps) {
  const t = useTranslations();
  const { symbol } = useCurrency();
  const linePrice = item.price * item.quantity;

  // Use parentProductId for navigation (link back to product page)
  const productLinkId = item.parentProductId;
  const productPath = `/product/${buildProductSlug(productLinkId, item.title)}`;

  const handleDecrease = () => {
    if (onUpdateQuantityByDelta) {
      onUpdateQuantityByDelta(-1);
    } else if (onUpdateQuantity) {
      onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1));
    }
  };

  const handleIncrease = () => {
    if (onUpdateQuantityByDelta) {
      onUpdateQuantityByDelta(1);
    } else if (onUpdateQuantity) {
      onUpdateQuantity(item.productId, item.quantity + 1);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(item.productId);
    }
  };

  return (
    <div className="flex gap-4 py-6 px-6 border-b border-gray-100">
      {/* Image */}
      <div className="w-24 h-32 flex-shrink-0 overflow-hidden">
        <LocalizedLink href={productPath} className="block cursor-pointer">
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full max-h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
          />
        </LocalizedLink>
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <LocalizedLink href={productPath} className="hover:underline cursor-pointer">
              <h3 className="font-semibold text-dark text-lg hover:text-burgundy transition-colors">{item.title}</h3>
            </LocalizedLink>
            {item.variantTitle && <p className="text-sm text-gray-400 italic">({item.variantTitle})</p>}
            {item.author && <p className="text-sm text-gray-500">{item.author}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-dark">
              {symbol}{linePrice.toFixed(2)}
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
