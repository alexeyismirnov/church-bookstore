import { CartItem } from '@/app/types';

interface OrderSummaryProps {
  cartItems: CartItem[];
  shipping?: number;
}

export function OrderSummary({ cartItems, shipping = 0 }: OrderSummaryProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <h2 className="text-lg font-bold text-dark mb-4">Order Summary</h2>

      {/* Line Items */}
      <div className="space-y-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="w-16 h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
              {item.coverImage && (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-dark truncate">{item.title}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="text-sm font-medium text-dark">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-dark">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-dark">
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-100">
          <span className="text-dark">Total</span>
          <span className="text-dark">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
