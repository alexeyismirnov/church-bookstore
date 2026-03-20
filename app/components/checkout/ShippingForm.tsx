'use client';

import { useState } from 'react';
import { ShippingAddress } from '@/app/types';
import { CountryAutocomplete } from './CountryAutocomplete';

// Re-export ShippingAddress for use by CheckoutForm
export type { ShippingAddress };

interface ShippingFormProps {
  onComplete: (address: ShippingAddress) => void;
}

export function ShippingForm({ onComplete }: ShippingFormProps) {
  const [address, setAddress] = useState<ShippingAddress>({
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
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!address.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!address.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!address.line1.trim()) newErrors.line1 = 'Street address is required';
    if (!address.country.trim()) newErrors.country = 'Country is required';

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
      <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>

      {/* Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            value={address.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            required
            placeholder="John"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
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
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            value={address.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            required
            placeholder="Doe"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
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
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          id="line1"
          type="text"
          value={address.line1}
          onChange={(e) => handleChange('line1', e.target.value)}
          required
          placeholder="123 Main Street"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
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
          Apartment, Suite, etc.
        </label>
        <input
          id="line2"
          type="text"
          value={address.line2}
          onChange={(e) => handleChange('line2', e.target.value)}
          placeholder="Apt 4B"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>

      {/* Address Line 3 */}
      <div>
        <label htmlFor="line3" className="block text-sm font-medium text-gray-700 mb-1">
          Building Name, Floor, etc.
        </label>
        <input
          id="line3"
          type="text"
          value={address.line3}
          onChange={(e) => handleChange('line3', e.target.value)}
          placeholder="Tower A, 5th Floor"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>

      {/* City, State, ZIP Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label htmlFor="line4" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="line4"
            type="text"
            value={address.line4}
            onChange={(e) => handleChange('line4', e.target.value)}
            placeholder="San Francisco"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State / Province / Region
          </label>
          <input
            id="state"
            type="text"
            value={address.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="California"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* ZIP Code */}
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP / Postal Code
          </label>
          <input
            id="postcode"
            type="text"
            value={address.postcode}
            onChange={(e) => handleChange('postcode', e.target.value)}
            placeholder="94102"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
          Phone Number
        </label>
        <input
          id="phone_number"
          type="tel"
          value={address.phone_number}
          onChange={(e) => handleChange('phone_number', e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>

      {/* Delivery Instructions */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Instructions
        </label>
        <textarea
          id="notes"
          value={address.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Leave at door, ring doorbell, etc."
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full btn-primary py-3 text-base font-medium"
      >
        Continue to Payment
      </button>
    </form>
  );
}
