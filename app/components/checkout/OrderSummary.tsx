import { ShippingMethod } from '@/app/types';

interface OrderSummaryItem {
  id: string;
  title: string;
  coverImage?: string;
  price: number;
  quantity: number;
}

interface OrderSummaryProps {
  cartItems: OrderSummaryItem[];
  shipping?: number;
  currencySymbol?: string;
  selectedShippingMethod?: ShippingMethod | null;
  isShippingRequired?: boolean;
}

/**
 * Get the display name for a shipping method.
 * The backend may return the name in different fields depending on the API:
 * - 'name' - Standard Oscar shipping method name
 * - 'code' - Fallback to code if name is empty
 * - 'description' - Some APIs use description instead of name
 */
function getShippingMethodDisplayName(method: ShippingMethod): string {
  // Check for name field (may be empty string or undefined)
  if (method.name && method.name.trim()) {
    return method.name.trim();
  }
  
  // Check for description field (some APIs use this)
  const methodWithDescription = method as ShippingMethod & { description?: string };
  if (methodWithDescription.description && methodWithDescription.description.trim()) {
    return methodWithDescription.description.trim();
  }
  
  // Fallback to code, formatted for display
  if (method.code && method.code.trim()) {
    // Convert code like "free-shipping" or "standard" to "Free Shipping" or "Standard"
    return method.code
      .trim()
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Ultimate fallback
  return 'Shipping';
}

export function OrderSummary({
  cartItems,
  shipping = 0,
  currencySymbol = '$',
  selectedShippingMethod,
  isShippingRequired = true
}: OrderSummaryProps) {
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
              {currencySymbol}{(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-dark">{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Shipping
            {selectedShippingMethod && (
              <span className="text-gray-400 ml-1">
                ({getShippingMethodDisplayName(selectedShippingMethod)})
              </span>
            )}
          </span>
          <span className="text-dark">
            {!isShippingRequired
              ? 'Free'
              : !selectedShippingMethod
                ? 'TBD'
                : shipping === 0
                  ? 'Free'
                  : `${currencySymbol}${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-100">
          <span className="text-dark">Total</span>
          <span className="text-dark">{currencySymbol}{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
