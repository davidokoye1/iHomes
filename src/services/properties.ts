// src/services/properties.ts
import { supabase } from "../lib/supabaseClient";
import type {
  Property,
  PropertyImage,
  PropertyWithImages,
  PropertyListing,
  PropertyFormData,
  SearchParams,
  DashboardStats,
  SearchResult
} from "../types/database";

/**
 * PropertiesService - Centralized service for all property-related operations
 * Handles CRUD operations, search functionality, and data transformations
 */
export class PropertiesService {
  /**
   * Get all locations from database
   * Used for location-based filtering and property creation
   */
  static async getLocations() {
    try {
      const { data, error } = await supabase
          .from("locations")
          .select("*")
          .order("is_popular", { ascending: false })
          .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching locations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  }

  /**
   * Get all amenities from database
   * Used for amenity-based filtering and property features
   */
  static async getAmenities() {
    try {
      const { data, error } = await supabase
          .from("amenities")
          .select("*")
          .order("category", { ascending: true })
          .order("is_popular", { ascending: false })
          .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching amenities:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching amenities:", error);
      return [];
    }
  }

  /**
   * Get system settings from database
   * Returns key-value pairs for application configuration
   */
  static async getSettings() {
    try {
      const { data, error } = await supabase
          .from("settings")
          .select("*");

      if (error) {
        console.error("Error fetching settings:", error);
        return {};
      }

      // Convert array to key-value object for easier access
      const settings: Record<string, string> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      return settings;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return {};
    }
  }

  /**
   * Get detailed property information by ID
   * Includes images, amenities, and agent information
   */
  static async getPropertyById(id: string): Promise<PropertyWithImages | null> {
    try {
      // Get main property data with related information
      const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select(`
          *,
          agent:profiles!properties_agent_id_fkey(full_name, phone, agency_name, avatar_url, email),
          location:locations(name, region)
        `)
          .eq("id", id)
          .single();

      if (propertyError || !property) {
        console.error("Error fetching property:", propertyError);
        return null;
      }

      // Get property images ordered by display order
      const { data: images, error: imagesError } = await supabase
          .from("property_images")
          .select("*")
          .eq("property_id", id)
          .order("display_order", { ascending: true });

      if (imagesError) {
        console.error("Error fetching property images:", imagesError);
      }

      // Get property amenities with full amenity details
      const { data: amenitiesData, error: amenitiesError } = await supabase
          .from("property_amenities")
          .select("amenity:amenities(id, name, icon_name, category)")
          .eq("property_id", id);

      if (amenitiesError) {
        console.error("Error fetching property amenities:", amenitiesError);
      }

      // Find primary image
      const primaryImage = images?.find(img => img.is_primary);

      return {
        ...property,
        images: images || [],
        primary_image: primaryImage?.image_url,
        amenities: amenitiesData?.map(a => a.amenity) || [],
        agent_name: property.agent?.full_name,
        agent_phone: property.agent?.phone,
        agency_name: property.agent?.agency_name
      };
    } catch (error) {
      console.error("Error in getPropertyById:", error);
      return null;
    }
  }

  /**
   * Get featured properties for homepage display
   * Uses view or fallback query for compatibility
   */
  static async getFeaturedProperties(limit: number = 5): Promise<PropertyListing[]> {
    try {
      const { data: properties, error } = await supabase
          .from("v_featured_properties")
          .select(`
          id,
          title,
          price,
          property_type,
          listing_type,
          address,
          city,
          bedrooms,
          bathrooms,
          square_feet,
          primary_image,
          agent_name,
          agent_phone,
          agency_name,
          featured,
          views_count,
          created_at
        `)
          .limit(limit);

      if (error) {
        console.error("Error fetching featured properties:", error);

        // Handle view permission error with fallback
        if (error.code === '42501') {
          console.error("VIEW PERMISSION ERROR: Ensure you've granted SELECT permission to anon/authenticated");
          const { data: fallbackData } = await supabase
              .from("properties")
              .select(`
              id,
              title,
              price,
              property_type,
              listing_type,
              address,
              city,
              bedrooms,
              bathrooms,
              square_feet,
              featured,
              views_count,
              created_at
            `)
              .eq("featured", true)
              .eq("status", "active")
              .limit(limit);

          return fallbackData || [];
        }
        return [];
      }

      return properties || [];
    } catch (error) {
      console.error("Error in getFeaturedProperties:", error);
      return [];
    }
  }

  /**
   * Get recently added properties
   * Uses view or fallback query for compatibility
   */
  static async getRecentProperties(limit: number = 8): Promise<PropertyListing[]> {
    try {
      const { data: properties, error } = await supabase
          .from("v_active_properties")
          .select(`
          id,
          title,
          price,
          property_type,
          listing_type,
          address,
          city,
          bedrooms,
          bathrooms,
          square_feet,
          primary_image,
          agent_name,
          agent_phone,
          agency_name,
          featured,
          views_count,
          created_at
        `)
          .order("created_at", { ascending: false })
          .limit(limit);

      if (error) {
        console.error("Error fetching recent properties:", error);

        // Handle view permission error with fallback
        if (error.code === '42501') {
          console.error("VIEW PERMISSION ERROR: Ensure you've granted SELECT permission to anon/authenticated");
          const { data: fallbackData } = await supabase
              .from("properties")
              .select(`
              id,
              title,
              price,
              property_type,
              listing_type,
              address,
              city,
              bedrooms,
              bathrooms,
              square_feet,
              featured,
              views_count,
              created_at
            `)
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(limit);

          return fallbackData || [];
        }
        return [];
      }

      return properties || [];
    } catch (error) {
      console.error("Error in getRecentProperties:", error);
      return [];
    }
  }

  /**
   * Get property suggestions based on current property
   * Uses location, city, and property type for matching
   */
  static async getPropertySuggestions(propertyId: string, limit: number = 4): Promise<PropertyListing[]> {
    try {
      // Get current property details for comparison
      const { data: currentProperty, error: currentPropertyError } = await supabase
          .from("properties")
          .select("city, property_type, price, location_id")
          .eq("id", propertyId)
          .single();

      if (currentPropertyError || !currentProperty) {
        console.error("Error fetching current property:", currentPropertyError);
        return [];
      }

      // Try to find similar properties in same location first
      let { data: properties, error } = await supabase
          .from("v_active_properties")
          .select(`
          id,
          title,
          price,
          property_type,
          listing_type,
          address,
          city,
          bedrooms,
          bathrooms,
          square_feet,
          primary_image,
          agent_name,
          agent_phone,
          agency_name,
          featured,
          views_count,
          created_at
        `)
          .neq("id", propertyId)
          .eq("location_id", currentProperty.location_id)
          .order("created_at", { ascending: false })
          .limit(limit);

      // If not enough properties in same location, expand to same city
      if (properties && properties.length < limit) {
        const remainingLimit = limit - properties.length;
        const { data: cityProperties, error: cityError } = await supabase
            .from("v_active_properties")
            .select(`
            id,
            title,
            price,
            property_type,
            listing_type,
            address,
            city,
            bedrooms,
            bathrooms,
            square_feet,
            primary_image,
            agent_name,
            agent_phone,
            agency_name,
            featured,
            views_count,
            created_at
          `)
            .neq("id", propertyId)
            .eq("city", currentProperty.city)
            .not("location_id", "eq", currentProperty.location_id)
            .order("created_at", { ascending: false })
            .limit(remainingLimit);

        if (cityError) {
          console.error("Error fetching city properties:", cityError);
        } else {
          properties = [...properties, ...(cityProperties || [])];
        }
      }

      // If still not enough, get similar property types
      if (properties && properties.length < limit) {
        const remainingLimit = limit - properties.length;
        const { data: typeProperties, error: typeError } = await supabase
            .from("v_active_properties")
            .select(`
            id,
            title,
            price,
            property_type,
            listing_type,
            address,
            city,
            bedrooms,
            bathrooms,
            square_feet,
            primary_image,
            agent_name,
            agent_phone,
            agency_name,
            featured,
            views_count,
            created_at
          `)
            .neq("id", propertyId)
            .eq("property_type", currentProperty.property_type)
            .neq("city", currentProperty.city)
            .order("created_at", { ascending: false })
            .limit(remainingLimit);

        if (typeError) {
          console.error("Error fetching type properties:", typeError);
        } else {
          properties = [...properties, ...(typeProperties || [])];
        }
      }

      if (error) {
        console.error("Error fetching suggested properties:", error);
        return [];
      }

      return properties || [];
    } catch (error) {
      console.error("Error in getPropertySuggestions:", error);
      return [];
    }
  }

  /**
   * Advanced property search with filtering and pagination
   * Uses RPC function with fallback to direct queries
   */
  static async searchProperties(params: SearchParams): Promise<{
    properties: SearchResult[];
    total_count: number;
    has_more: boolean;
  }> {
    try {
      console.log("=== SEARCH DEBUG START ===");
      console.log("Input params (frontend):", params);

      // Destructure and set defaults for search parameters
      const {
        search_text = '',
        property_type,
        listing_type,
        min_price,
        max_price,
        min_bedrooms,
        max_bedrooms,
        min_bathrooms,
        max_bathrooms,
        city,
        location_id,
        amenity_ids,
        featured_only = false,
        sort_by = 'created_at',
        sort_order = 'DESC',
        limit = 12,
        offset = 0
      } = params;

      // Map frontend parameter names to database function parameter names
      const rpcParams = {
        search_text,
        prop_type: property_type || null,
        list_type: listing_type || null,
        min_price: min_price || null,
        max_price: max_price || null,
        min_beds: min_bedrooms || null,  // Fixed: min_bedrooms -> min_beds
        max_beds: max_bedrooms || null,   // Fixed: max_bedrooms -> max_beds
        min_baths: min_bathrooms || null, // Fixed: min_bathrooms -> min_baths
        max_baths: max_bathrooms || null, // Fixed: max_bathrooms -> max_baths (this was missing)
        city_name: city || null,
        location_id: location_id || null,
        amenity_ids: amenity_ids && amenity_ids.length > 0 ? amenity_ids : null,
        featured_only,
        sort_by,
        sort_order,
        limit_results: limit,
        offset_results: offset
      };

      console.log("RPC Parameters (database):", rpcParams);

      // Try to use the RPC function first
      const { data, error } = await supabase.rpc('search_properties', rpcParams);

      if (error) {
        console.error("Error searching properties:", error);

        // Provide detailed error information for debugging
        if (error.code === '42P13') {
          console.error("FUNCTION LANGUAGE ERROR: Check if search_properties function has LANGUAGE specification");
        } else if (error.message.includes("must appear in the GROUP BY clause")) {
          console.error("VIEW DEFINITION ERROR: Your view has incorrect GROUP BY clauses");
        } else if (error.code === '42702') {
          console.error("AMBIGUOUS COLUMN ERROR: Check for column name conflicts in your function");
        }

        // Fallback to direct query if RPC fails
        console.log("Attempting fallback query...");
        return await this.fallbackSearch(params);
      }

      // Process the successful RPC response
      const processedProperties = (data || []).map(p => ({
        ...p,
        // Convert price from string to number if needed
        price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
        // Handle possible null/undefined values
        bedrooms: p.bedrooms || 0,
        bathrooms: p.bathrooms || 0,
        square_feet: p.square_feet || 0,
        // Remove total_count from individual properties
        total_count: undefined
      }));

      const total_count = processedProperties.length > 0 ? processedProperties[0].total_count : 0;
      const has_more = offset + processedProperties.length < total_count;

      console.log("Final result:", {
        properties_count: processedProperties.length,
        total_count,
        has_more,
        first_property: processedProperties[0]
      });
      console.log("=== SEARCH DEBUG END ===");

      return {
        properties: processedProperties,
        total_count,
        has_more
      };
    } catch (error) {
      console.error("Error in searchProperties:", error);
      return { properties: [], total_count: 0, has_more: false };
    }
  }

  /**
   * Fallback search method when RPC function fails
   * Uses direct database queries with Supabase filters
   */
  private static async fallbackSearch(params: SearchParams): Promise<{
    properties: SearchResult[];
    total_count: number;
    has_more: boolean;
  }> {
    try {
      const {
        search_text = '',
        property_type,
        listing_type,
        min_price,
        max_price,
        min_bedrooms,
        max_bedrooms,
        min_bathrooms,
        max_bathrooms,
        city,
        location_id,
        amenity_ids,
        featured_only = false,
        sort_by = 'created_at',
        sort_order = 'DESC',
        limit = 12,
        offset = 0
      } = params;

      // Build the base query
      let query = supabase
          .from("v_active_properties")
          .select(`
          id,
          title,
          price,
          property_type,
          listing_type,
          address,
          city,
          bedrooms,
          bathrooms,
          square_feet,
          primary_image,
          agent_name,
          agent_phone,
          agency_name,
          featured,
          views_count,
          created_at
        `);

      // Apply filters conditionally
      if (search_text) {
        query = query.ilike('title', `%${search_text}%`);
      }

      if (property_type) {
        query = query.eq('property_type', property_type);
      }

      if (listing_type) {
        query = query.eq('listing_type', listing_type);
      }

      if (min_price) {
        query = query.gte('price', min_price);
      }

      if (max_price) {
        query = query.lte('price', max_price);
      }

      if (min_bedrooms) {
        query = query.gte('bedrooms', min_bedrooms);
      }

      if (max_bedrooms) {
        query = query.lte('bedrooms', max_bedrooms);
      }

      if (min_bathrooms) {
        query = query.gte('bathrooms', min_bathrooms);
      }

      if (max_bathrooms) {
        query = query.lte('bathrooms', max_bathrooms);
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (location_id) {
        query = query.eq('location_id', location_id);
      }

      if (featured_only) {
        query = query.eq('featured', true);
      }

      // Handle amenities filter (this is complex with direct queries)
      if (amenity_ids && amenity_ids.length > 0) {
        // This would require a more complex subquery or join
        console.log("Amenity filtering not fully supported in fallback mode");
      }

      // Apply sorting
      const ascending = sort_order === 'ASC';
      query = query.order(sort_by as any, { ascending });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: fallbackData, error: fallbackError } = await query;

      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return { properties: [], total_count: 0, has_more: false };
      }

      // Get total count for pagination - simplified version
      let countQuery = supabase
          .from("v_active_properties")
          .select('*', { count: 'exact', head: true });

      // Apply the same filters for counting
      if (search_text) {
        countQuery = countQuery.ilike('title', `%${search_text}%`);
      }
      if (property_type) {
        countQuery = countQuery.eq('property_type', property_type);
      }
      if (listing_type) {
        countQuery = countQuery.eq('listing_type', listing_type);
      }
      if (min_price) {
        countQuery = countQuery.gte('price', min_price);
      }
      if (max_price) {
        countQuery = countQuery.lte('price', max_price);
      }
      if (min_bedrooms) {
        countQuery = countQuery.gte('bedrooms', min_bedrooms);
      }
      if (max_bedrooms) {
        countQuery = countQuery.lte('bedrooms', max_bedrooms);
      }
      if (min_bathrooms) {
        countQuery = countQuery.gte('bathrooms', min_bathrooms);
      }
      if (max_bathrooms) {
        countQuery = countQuery.lte('bathrooms', max_bathrooms);
      }
      if (city) {
        countQuery = countQuery.ilike('city', `%${city}%`);
      }
      if (location_id) {
        countQuery = countQuery.eq('location_id', location_id);
      }
      if (featured_only) {
        countQuery = countQuery.eq('featured', true);
      }

      const { count: total_count } = await countQuery;

      return {
        properties: fallbackData || [],
        total_count: total_count || 0,
        has_more: offset + (fallbackData?.length || 0) < (total_count || 0)
      };
    } catch (error) {
      console.error("Error in fallbackSearch:", error);
      return { properties: [], total_count: 0, has_more: false };
    }
  }

  /**
   * Create a new property listing
   * Handles property data, image uploads, and amenity associations
   */
  static async createProperty(data: PropertyFormData, userId: string): Promise<Property | null> {
    try {
      const { images, amenities, ...propertyData } = data;

      // Insert the main property record
      const { data: newProperty, error: propertyError } = await supabase
          .from("properties")
          .insert({
            ...propertyData,
            agent_id: userId,
            status: "active",
            views_count: 0,
            inquiry_count: 0,
            featured: false,
            parking_spaces: propertyData.parking_spaces || 0,
            is_furnished: propertyData.is_furnished || false,
            published_at: new Date().toISOString()
          })
          .select()
          .single();

      if (propertyError || !newProperty) {
        console.error("Error creating property:", propertyError);
        return null;
      }

      // Handle image uploads if provided
      if (images && images.length > 0) {
        const imageInserts = await Promise.all(
            images.map(async (file, index) => {
              try {
                const fileExt = file.name.split(".").pop();
                const fileName = `${newProperty.id}/${Date.now()}_${index}.${fileExt}`;

                // Upload to Supabase storage
                const { error: uploadError } = await supabase.storage
                    .from("property-images")
                    .upload(fileName, file);

                if (uploadError) {
                  console.error("Error uploading image:", uploadError);
                  return null;
                }

                // Get public URL
                const { data: publicUrlData } = supabase.storage
                    .from("property-images")
                    .getPublicUrl(fileName);

                return {
                  property_id: newProperty.id,
                  image_url: publicUrlData.publicUrl,
                  is_primary: index === 0,
                  display_order: index,
                };
              } catch (error) {
                console.error("Error processing image:", error);
                return null;
              }
            })
        );

        // Filter out failed uploads and insert successful ones
        const validImages = imageInserts.filter(img => img !== null) as PropertyImage[];
        if (validImages.length > 0) {
          const { error: imagesError } = await supabase
              .from("property_images")
              .insert(validImages);

          if (imagesError) {
            console.error("Error saving image metadata:", imagesError);
          }
        }
      }

      // Handle amenity associations if provided
      if (amenities && amenities.length > 0) {
        const amenityInserts = amenities.map(amenityId => ({
          property_id: newProperty.id,
          amenity_id: amenityId
        }));

        const { error: amenitiesError } = await supabase
            .from("property_amenities")
            .insert(amenityInserts);

        if (amenitiesError) {
          console.error("Error saving amenities:", amenitiesError);
        }
      }

      // Log the activity for audit trail
      try {
        await supabase
            .from("activity_logs")
            .insert({
              user_id: userId,
              action: "property_created",
              entity_type: "property",
              entity_id: newProperty.id,
              details: { title: newProperty.title }
            });
      } catch (error) {
        console.error("Error logging activity:", error);
        // Don't fail property creation for logging issues
      }

      return newProperty;
    } catch (error) {
      console.error("Error in createProperty:", error);
      return null;
    }
  }

  /**
   * Record a property view for analytics
   * Updates view count and tracks user engagement
   */
  static async recordPropertyView(propertyId: string, userId?: string): Promise<void> {
    try {
      // Insert into property_views table (trigger will auto-increment views_count)
      const { error } = await supabase
          .from("property_views")
          .insert({
            property_id: propertyId,
            user_id: userId || null,
            viewed_at: new Date().toISOString()
          });

      if (error) {
        console.error("Error recording property view:", error);
      }
    } catch (error) {
      console.error("Error in recordPropertyView:", error);
    }
  }

  /**
   * Get all properties by a specific agent
   * Used for agent profile pages and dashboards
   */
  static async getPropertiesByAgent(agentId: string): Promise<PropertyListing[]> {
    try {
      const { data: properties, error } = await supabase
          .from("v_active_properties")
          .select(`
          id,
          title,
          price,
          property_type,
          listing_type,
          address,
          city,
          bedrooms,
          bathrooms,
          square_feet,
          primary_image,
          agent_name,
          agent_phone,
          agency_name,
          featured,
          views_count,
          created_at
        `)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching agent properties:", error);
        return [];
      }

      return properties || [];
    } catch (error) {
      console.error("Error in getPropertiesByAgent:", error);
      return [];
    }
  }

  /**
   * Delete a property and all associated data
   * Handles cascading deletes and storage cleanup
   */
  static async deleteProperty(propertyId: string): Promise<boolean> {
    try {
      // Get property images for storage cleanup
      const { data: images, error: imagesError } = await supabase
          .from("property_images")
          .select("image_url")
          .eq("property_id", propertyId);

      if (imagesError) {
        console.error("Error fetching property images:", imagesError);
      }

      // Delete images from storage
      if (images && images.length > 0) {
        const filePaths = images
            .map(img => {
              const url = img.image_url;
              const match = url.match(/property-images\/(.+)$/);
              return match ? match[1] : null;
            })
            .filter(Boolean) as string[];

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
              .from("property-images")
              .remove(filePaths);

          if (storageError) {
            console.error("Error deleting images from storage:", storageError);
            // Continue with property deletion even if image deletion fails
          }
        }
      }

      // Delete the property (cascading deletes will handle related records)
      const { error } = await supabase
          .from("properties")
          .delete()
          .eq("id", propertyId);

      if (error) {
        console.error("Error deleting property:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteProperty:", error);
      return false;
    }
  }

  /**
   * Get dashboard statistics for agents and admins
   * Provides property counts, inquiries, and featured properties
   */
  static async getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
    try {
      // Determine if user is an agent (for filtering)
      const isAgent = role === "agent";
      const agentCondition = isAgent ? { agent_id: userId } : {};

      // Get property counts
      const { count: totalProperties } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .match(agentCondition);

      const { count: activeProperties } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .match({ ...agentCondition, status: "active" });

      // Get recent inquiries
      const { data: inquiries, error: inquiriesError } = await supabase
          .from("inquiries")
          .select(`
          *,
          property:properties(title, address, city)
        `)
          .match(isAgent ? { agent_id: userId } : {})
          .order("created_at", { ascending: false })
          .limit(5);

      if (inquiriesError) {
        console.error("Error fetching inquiries:", inquiriesError);
      }

      // Get featured properties
      const { data: featuredProperties, error: featuredError } = await supabase
          .from("v_featured_properties")
          .select(`
          id,
          title,
          price,
          property_type,
          listing_type,
          address,
          city,
          bedrooms,
          bathrooms,
          square_feet,
          primary_image,
          agent_name,
          agent_phone,
          agency_name,
          featured,
          views_count,
          created_at
        `)
          .match(agentCondition)
          .limit(5);

      if (featuredError) {
        console.error("Error fetching featured properties:", featuredError);
      }

      return {
        total_properties: totalProperties || 0,
        active_properties: activeProperties || 0,
        total_inquiries: inquiries?.length || 0,
        recent_inquiries: inquiries || [],
        featured_properties: featuredProperties || [],
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      return {
        total_properties: 0,
        active_properties: 0,
        total_inquiries: 0,
        recent_inquiries: [],
        featured_properties: [],
      };
    }
  }

  /**
   * Create sample properties for testing and demo purposes
   * Uses the database function for consistent data generation
   */
  static async createSampleProperties(userId: string): Promise<number> {
    try {
      console.log("Creating sample properties for user:", userId);
      const { data, error } = await supabase.rpc('insert_sample_properties', {
        agent_user_id: userId
      });

      if (error) {
        console.error("Error creating sample properties:", error);
        throw error;
      }

      console.log(`Successfully created ${data} sample properties`);
      return data || 0;
    } catch (error) {
      console.error("Error in createSampleProperties:", error);
      throw error;
    }
  }

  /**
   * Toggle featured status of a property
   * Used by agents and admins to promote listings
   */
  static async toggleFeatured(propertyId: string, featured: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
          .from("properties")
          .update({ featured: !featured })
          .eq("id", propertyId);

      if (error) {
        console.error("Error toggling featured status:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in toggleFeatured:", error);
      return false;
    }
  }

  /**
   * Update property status (active, pending, sold, inactive)
   * Used for property lifecycle management
   */
  static async updatePropertyStatus(propertyId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
          .from("properties")
          .update({ status })
          .eq("id", propertyId);

      if (error) {
        console.error("Error updating property status:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updatePropertyStatus:", error);
      return false;
    }
  }
}