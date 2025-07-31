// src/types/database.ts
// Database Types for iHomes Real Estate App - Streamlined Version

export type UserRole = 'user' | 'agent' | 'admin';
export type PropertyStatus = 'active' | 'pending' | 'sold' | 'inactive';
export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'villa' | 'land' | 'commercial';
export type ListingType = 'sale' | 'rent';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  organization_name?: string;
  agency_name?: string;
  license_number?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  property_type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  
  // Location
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  
  // Property Details
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  
  // Key Features
  parking_spaces: number;
  is_furnished: boolean;
  has_pool: boolean;
  has_garden: boolean;
  
  // Listing Info
  agent_id: string;
  featured: boolean;
  views_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface PropertyWithImages extends Property {
  images: PropertyImage[];
  primary_image?: string;
}

export interface PropertyListing extends Property {
  primary_image?: string;
  agent_name?: string;
  agent_phone?: string;
  agency_name?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  property_id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone?: string;
  message: string;
  agent_id?: string;
  status: string;
  created_at: string;
}

// Form Types
export interface PropertyFormData {
  title: string;
  description?: string;
  price: number;
  property_type: PropertyType;
  listing_type: ListingType;
  
  // Location
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  
  // Property Details
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  
  // Key Features
  parking_spaces?: number;
  is_furnished?: boolean;
  has_pool?: boolean;
  has_garden?: boolean;
  
  // Images
  images?: File[];
}

export interface SearchFilters {
  search_text?: string;
  property_type?: PropertyType;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  city?: string;
  featured_only?: boolean;
  has_pool?: boolean;
  has_garden?: boolean;
  is_furnished?: boolean;
}

export interface SearchParams extends SearchFilters {
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  price: number;
  property_type: PropertyType;
  listing_type: ListingType;
  address: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  primary_image?: string;
  agent_name?: string;
  featured: boolean;
}

// Dashboard Analytics Types
export interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_inquiries: number;
  recent_inquiries: Inquiry[];
  featured_properties: PropertyListing[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  has_more: boolean;
  page: number;
  limit: number;
}