import countries from './countries.json';
import type { ShippingAddress } from '../types';

export interface ShippingAddressDisplay {
  name: string;
  addressLines: string[];
  country: string;
  phone?: string;
  notes?: string;
}

/** Build display lines for a shipping address, omitting empty fields. */
export function getShippingAddressDisplay(address: ShippingAddress): ShippingAddressDisplay {
  const addressLines: string[] = [];

  if (address.line1?.trim()) addressLines.push(address.line1.trim());
  if (address.line2?.trim()) addressLines.push(address.line2.trim());
  if (address.line3?.trim()) addressLines.push(address.line3.trim());

  const cityStateZip = [address.line4, address.state, address.postcode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) addressLines.push(cityStateZip);

  const country =
    countries.find((c) => c.code === address.country)?.name || address.country;

  return {
    name: [address.first_name, address.last_name].filter(Boolean).join(' ').trim(),
    addressLines,
    country,
    phone: address.phone_number?.trim() || undefined,
    notes: address.notes?.trim() || undefined,
  };
}
