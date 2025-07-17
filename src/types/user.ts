import { HttpTypes } from '@medusajs/types';

export interface Review {
  id: string;
  rating: number;
  customer_id: string;
  customer_note: string;
  created_at: string;
  reference: string;
}

export interface StoreVendor {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  description?: string;
  handle?: string;
  photo?: string;
  created_at?: string;
  product?: HttpTypes.StoreProduct[];
  review?: Review | Review[];
  address_line?: string;
  postal_code?: string;
  city?: string;
  country_code?: string;
  tax_id?: string;
  availability?: VendorAvailability;
}

export interface TeamMemberProps {
  id: string;
  seller_id: string;
  name: string;
  email?: string;
  photo?: string;
  bio?: string;
  phone?: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  vendor?: StoreVendor;
  vendor_id?: string; // Direct vendor ID in some API responses
  role?: string;     // User role (e.g., 'vendor', 'admin')
  created_at: string;
  updated_at: string;
}

export interface VendorAvailability {
  is_holiday_mode: boolean;
  holiday_start_date: string | null;
  holiday_end_date: string | null;
  holiday_message: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
}
