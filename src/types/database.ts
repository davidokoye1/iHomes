// src/types/database.ts - FINAL FIXED VERSION
export type UserRole = 'user' | 'agent' | 'admin';
export type PropertyStatus = 'active' | 'pending' | 'sold' | 'inactive';
export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'villa' | 'land' | 'commercial';
export type ListingType = 'sale' | 'rent';
export type InquiryStatus = 'new' | 'contacted' | 'scheduled' | 'closed';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  agency_name?: string;
  license_number?: string;
  bio?: string;
  website?: string;
  is_verified: boolean;
  email_confirmed: boolean;
  last_login_at?: string;
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
  location_id?: string;
  latitude?: number;
  longitude?: number;
  
  // Property Details
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  floors?: number;
  
  // Key Features
  parking_spaces: number;
  is_furnished: boolean;
  
  // Listing Info
  agent_id: string;
  featured: boolean;
  views_count: number;
  inquiry_count: number;
  
  // SEO & Marketing
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  caption?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

// Type for inserting new property images (omits auto-generated fields)
export type PropertyImageInsert = Omit<PropertyImage, 'id' | 'created_at'>;

export interface PropertyWithImages extends Property {
  images: PropertyImage[];
  primary_image?: string;
  amenities?: Array<{ 
    id: string; 
    name: string; 
    icon_name?: string; 
    category: string 
  }>;
  agent_name?: string;
  agent_phone?: string;
  agency_name?: string;
  agent_avatar?: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  price: number;
  property_type: PropertyType;
  listing_type: ListingType;
  address: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  primary_image?: string;
  agent_name?: string;
  agent_phone?: string;
  agency_name?: string;
  featured: boolean;
  views_count: number;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  parent_id?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  is_popular: boolean;
  display_order: number;
  created_at: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon_name?: string;
  category: string;
  is_popular: boolean;
  display_order: number;
  created_at: string;
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
  status: InquiryStatus;
  priority?: number;
  scheduled_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyView {
  id: string;
  property_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  viewed_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  description?: string;
  category?: string;
  updated_at: string;
}

export interface PropertyStats {
  month: string;
  property_type: PropertyType;
  listing_type: ListingType;
  city: string;
  total_properties: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  total_views: number;
  featured_count: number;
}



export interface AgentPerformance {
  id: string;
  full_name: string;
  email: string;
  agency_name?: string;
  total_properties: number;
  active_properties: number;
  sold_properties: number;
  featured_properties: number;
  total_views: number;
  total_inquiries: number;
  avg_property_price?: number;
  last_property_date?: string;
}

export interface PopularLocation {
  id: string;
  name: string;
  type: string;
  region?: string;
  property_count: number;
  avg_price?: number;
  is_popular: boolean;
}

export interface PropertyFormData {
  title: string;
  description?: string;
  price: number;
  property_type: PropertyType;
  listing_type: ListingType;
  
  // Location
  address: string;
  city: string;
  location_id?: string;
  latitude?: number;
  longitude?: number;
  
  // Property Details
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  floors?: number;
  
  // Key Features
  parking_spaces?: number;
  is_furnished?: boolean;
  
  // Images
  images?: File[];
  
  // Amenities
  amenities?: string[];
}

export interface SearchParams {
  search_text?: string;
  property_type?: PropertyType;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  city?: string;
  location_id?: string;
  amenity_ids?: string[];
  featured_only?: boolean;
  sort_by?: string;
  sort_order?: string;
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
  square_feet?: number;
  primary_image?: string;
  agent_name?: string;
  agent_phone?: string;
  agency_name?: string;
  featured: boolean;
  views_count: number;
  created_at: string;
  total_count?: number;
}

export interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_inquiries: number;
  recent_inquiries: Inquiry[];
  featured_properties: PropertyListing[];
}