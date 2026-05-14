'use client';

import { useState, useEffect, useRef } from 'react';
import { ShippingAddress, ShippingMethod } from '@/app/types';
import { CountryAutocomplete } from './CountryAutocomplete';
import { getShippingMethods } from '@/app/lib/api';
import { useTranslations } from '../../i18n/LanguageContext';

// Re-export ShippingAddress for use by CheckoutForm
export type { ShippingAddress };

interface ShippingFormProps {
  onComplete: (address: ShippingAddress) => void;
  initialData?: ShippingAddress;
  onShippingMethodsChange?: (methods: ShippingMethod[]) => void;
  onSelectedMethodChange?: (method: ShippingMethod | null) => void;
  selectedShippingMethod?: ShippingMethod | null;
  currency?: string;
}

export function ShippingForm({ 
  onComplete, 
  initialData,
  onShippingMethodsChange,
  onSelectedMethodChange,
  selectedShippingMethod,
  currency,
}: ShippingFormProps) {
  const t = useTranslations();
  const tCheckout = useTranslations('checkout');
  
  const [address, setAddress] = useState<ShippingAddress>(
    initialData || {
      first_name: '',
      last_name: '',
      line1: '',
      line2: '',
      line3: '',
      line4: '',
      state: '',
      postcode: '',
      country: 'US',
      phone_number: '',
      notes: '',
    }
  );

  // Update form when initialData changes (e.g., when going back to edit)
  useEffect(() => {
    if (initialData) {
      setAddress(initialData);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [isLoadingShippingMethods, setIsLoadingShippingMethods] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  
  // Track previous currency to detect currency changes
  const prevCurrencyRef = useRef(currency);

  // Track whether the address is incomplete (for showing appropriate message)
  const isAddressIncomplete = !address.country ||
    !address.first_name.trim() ||
    !address.last_name.trim() ||
    !address.line1.trim();

  // Fetch shipping methods when country or currency changes
  useEffect(() => {
    let didCancel = false;

    const fetchShippingMethods = async () => {
      // Detect if currency changed - we need to force re-select when it does
      const currencyChanged = prevCurrencyRef.current !== currency;
      prevCurrencyRef.current = currency;
      
      if (!address.country) return;
      
      // Check if address has minimum required fields for shipping calculation
      // The backend requires at least country, and for accurate shipping, we need
      // a complete address. Only call POST with address if we have required fields.
      const hasRequiredFields = address.country &&
        address.first_name.trim() &&
        address.last_name.trim() &&
        address.line1.trim();
      
      if (!hasRequiredFields) {
        // Address is incomplete - don't call the API yet
        // Clear any previous shipping methods and wait for user to fill the form
        if (didCancel) return;
        setShippingMethods([]);
        if (onShippingMethodsChange) {
          onShippingMethodsChange([]);
        }
        if (onSelectedMethodChange) {
          onSelectedMethodChange(null);
        }
        return;
      }
      
      if (!didCancel) {
        setIsLoadingShippingMethods(true);
        setShippingError(null);
      }
      
      try {
        // Pass the full shipping address to the backend API
        const methods = await getShippingMethods(address);
        
        // Skip state updates if this effect has been superseded by a newer run
        if (didCancel) return;
        
        setShippingMethods(methods);
        
        // Notify parent of available shipping methods
        if (onShippingMethodsChange) {
          onShippingMethodsChange(methods);
        }
        
        // Auto-select first method if available
        if (methods.length > 0 && onSelectedMethodChange) {
          // When currency changes, ALWAYS re-select to get updated prices
          // Otherwise, only auto-select if there's no selected method or if the selected one isn't in the new list
          const isSelectedAvailable = selectedShippingMethod &&
            methods.some(m => m.code === selectedShippingMethod.code);
          
          // Re-select if currency changed OR if the selected method isn't available
          if (currencyChanged || !isSelectedAvailable) {
            onSelectedMethodChange(methods[0]);
          }
        } else if (methods.length === 0 && onSelectedMethodChange) {
          // No methods available - clear selection
          onSelectedMethodChange(null);
        }
      } catch (err) {
        // Skip state updates if this effect has been superseded by a newer run
        if (didCancel) return;
        
        console.error('Failed to fetch shipping methods:', err);
        setShippingError(tCheckout('shippingSection.unableToLoad'));
        setShippingMethods([]);
        if (onShippingMethodsChange) {
          onShippingMethodsChange([]);
        }
        if (onSelectedMethodChange) {
          onSelectedMethodChange(null);
        }
      } finally {
        if (!didCancel) {
          setIsLoadingShippingMethods(false);
        }
      }
    };
    
    fetchShippingMethods();
    
    return () => {
      didCancel = true;
    };
  }, [address.country, address.first_name, address.last_name, address.line1, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle shipping method selection
  const handleShippingMethodChange = (methodCode: string) => {
    const method = shippingMethods.find(m => m.code === methodCode);
    if (method && onSelectedMethodChange) {
      onSelectedMethodChange(method);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!address.first_name.trim()) newErrors.first_name = tCheckout('validation.firstNameRequired');
    if (!address.last_name.trim()) newErrors.last_name = tCheckout('validation.lastNameRequired');
    if (!address.line1.trim()) newErrors.line1 = tCheckout('validation.streetRequired');
    if (!address.country.trim()) newErrors.country = tCheckout('validation.countryRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onComplete(address);
    }
  };

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">{tCheckout('shippingSection.address')}</h2>

      {/* Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkout.firstName')} <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            value={address.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            required
            placeholder={tCheckout('placeholders.firstName')}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors ${
              errors.first_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkout.lastName')} <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            value={address.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            required
            placeholder={tCheckout('placeholders.lastName')}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors ${
              errors.last_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
          )}
        </div>
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-1">
          {tCheckout('shippingSection.streetAddress')} <span className="text-red-500">*</span>
        </label>
        <input
          id="line1"
          type="text"
          value={address.line1}
          onChange={(e) => handleChange('line1', e.target.value)}
          required
          placeholder={tCheckout('placeholders.street')}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors ${
            errors.line1 ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.line1 && (
          <p className="mt-1 text-sm text-red-500">{errors.line1}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-1">
          {tCheckout('shippingSection.apartment')}
        </label>
        <input
          id="line2"
          type="text"
          value={address.line2}
          onChange={(e) => handleChange('line2', e.target.value)}
          placeholder={tCheckout('placeholders.apartment')}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors"
        />
      </div>

      {/* Address Line 3 */}
      <div>
        <label htmlFor="line3" className="block text-sm font-medium text-gray-700 mb-1">
          {tCheckout('shippingSection.building')}
        </label>
        <input
          id="line3"
          type="text"
          value={address.line3}
          onChange={(e) => handleChange('line3', e.target.value)}
          placeholder={tCheckout('placeholders.building')}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors"
        />
      </div>

      {/* City, State, ZIP Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label htmlFor="line4" className="block text-sm font-medium text-gray-700 mb-1">
            {t('checkout.city')}
          </label>
          <input
            id="line4"
            type="text"
            value={address.line4}
            onChange={(e) => handleChange('line4', e.target.value)}
            placeholder={tCheckout('placeholders.city')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors"
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            {tCheckout('shippingSection.stateProvince')}
          </label>
          <input
            id="state"
            type="text"
            value={address.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder={tCheckout('placeholders.state')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors"
          />
        </div>

        {/* ZIP Code */}
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
            {tCheckout('shippingSection.zipCode')}
          </label>
          <input
            id="postcode"
            type="text"
            value={address.postcode}
            onChange={(e) => handleChange('postcode', e.target.value)}
            placeholder={tCheckout('placeholders.zipCode')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors"
          />
        </div>
      </div>

      {/* Country */}
      <CountryAutocomplete
        value={address.country}
        onChange={(code) => handleChange('country', code)}
        error={errors.country}
      />

      {/* Phone Number */}
      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
          {tCheckout('shippingSection.phone')}
        </label>
        <input
          id="phone_number"
          type="tel"
          value={address.phone_number}
          onChange={(e) => handleChange('phone_number', e.target.value)}
          placeholder={tCheckout('placeholders.phone')}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors"
        />
      </div>

      {/* Delivery Instructions */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          {tCheckout('shippingSection.deliveryInstructions')}
        </label>
        <textarea
          id="notes"
          value={address.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder={tCheckout('placeholders.deliveryInstructions')}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors resize-none"
        />
      </div>

      {/* Shipping Method Selection - Hidden, auto-select first method */}
      {isLoadingShippingMethods && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-burgundy" />
          <span className="ml-2 text-gray-600">{tCheckout('shippingSection.loadingOptions')}</span>
        </div>
      )}
      {shippingError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {shippingError}
        </div>
      )}
      {!isLoadingShippingMethods && !shippingError && !isAddressIncomplete && shippingMethods.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          {tCheckout('shippingSection.noMethods')}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={shippingMethods.length === 0 || isLoadingShippingMethods}
        className={`w-full py-3 text-base font-medium rounded-lg transition-colors ${
          shippingMethods.length === 0 || isLoadingShippingMethods
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-burgundy text-white hover:bg-burgundy-dark'
        }`}
      >
        {isLoadingShippingMethods ? t('common.loading') : tCheckout('shippingSection.continueToPayment')}
      </button>
      
    </form>
  );
}
