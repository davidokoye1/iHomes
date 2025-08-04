// src/lib/mockData.ts
import { supabase } from "./supabaseClient";
import type { Property, PropertyImage } from "../types/database";

export const insertMockData = async (agentId: string) => {
  try {
    // First, get some real locations from the database to use in mock data
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("name")
      .limit(5);

    if (locationsError) throw locationsError;
    
    const popularCities = locations?.map(loc => loc.name) || ['Banjul', 'Serekunda', 'Fajara', 'Kololi', 'Lamin'];

    // Generate realistic mock properties
    const mockProperties: Omit<Property, 'id' | 'created_at' | 'updated_at'>[] = [];
    
    for (let i = 0; i < 10; i++) {
      const city = popularCities[Math.floor(Math.random() * popularCities.length)];
      const propertyType = ['apartment', 'house', 'villa', 'condo', 'townhouse'][Math.floor(Math.random() * 5)] as any;
      const listingType = Math.random() > 0.5 ? 'sale' : 'rent';
      
      mockProperties.push({
        title: `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} in ${city}`,
        description: `Beautiful ${propertyType} available for ${listingType}. Spacious rooms and modern amenities. Perfect for ${listingType === 'sale' ? 'investment or living' : 'short-term or long-term rental'}.`,
        price: listingType === 'sale' 
          ? 100000 + Math.floor(Math.random() * 900000)
          : 500 + Math.floor(Math.random() * 2500),
        property_type: propertyType,
        listing_type: listingType as any,
        status: 'active',
        address: `${Math.floor(Math.random() * 100)} ${['Main', 'Ocean', 'Park', 'Green', 'Hill'][Math.floor(Math.random() * 5)]} St`,
        city,
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        square_feet: 500 + Math.floor(Math.random() * 3500),
        year_built: 1980 + Math.floor(Math.random() * 40),
        parking_spaces: Math.floor(Math.random() * 4),
        is_furnished: Math.random() > 0.5,
        agent_id: agentId,
        featured: Math.random() > 0.7,
        inquiry_count: 0,
        views_count: Math.floor(Math.random() * 100),
        latitude: 13.444 + Math.random() * 0.5,
        longitude: -16.574 + Math.random() * 0.5
      });
    }

    // Insert properties
    const { data: insertedProperties, error: propertiesError } = await supabase
      .from("properties")
      .insert(mockProperties)
      .select();

    if (propertiesError) throw propertiesError;

    // Prepare image data for all properties
    const imageInserts: Omit<PropertyImage, 'id' | 'created_at'>[] = [];
    
    for (const property of insertedProperties) {
      // Primary image
      imageInserts.push({
        property_id: property.id,
        image_url: `/images/properties/${property.property_type}/1.jpg`,
        is_primary: true,
        display_order: 1
      });
      
      // Additional images
      for (let i = 2; i <= 4; i++) {
        imageInserts.push({
          property_id: property.id,
          image_url: `/images/properties/${property.property_type}/${i}.jpg`,
          is_primary: false,
          display_order: i
        });
      }
    }

    // Insert images
    const { error: imagesError } = await supabase
      .from("property_images")
      .insert(imageInserts);

    if (imagesError) throw imagesError;

    return {
      properties: insertedProperties,
      imageCount: imageInserts.length
    };
  } catch (error) {
    console.error('Error inserting mock data:', error);
    throw error;
  }
};