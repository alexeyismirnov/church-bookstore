'use client';

import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-6 border-b border-gray-100">
      {/* Image */}
      <div className="w-24 h-32 flex-shrink-0">
        <img
          src={item.coverImage}
          alt={item.title}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-dark text-lg">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.author}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-dark">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            {item.quantity > 1 && (
              <p className="text-sm text-gray-400">
                ${item.price.toFixed(2)} each
              </p>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button
              onClick={() => onRemove(item.id)}
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
