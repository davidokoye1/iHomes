import { supabase } from "../lib/supabaseClient";
import type {
  Property,
  PropertyImage,
  PropertyWithImages,
  PropertyListing,
  PropertyFormData,
  SearchParams,
  DashboardStats,
} from "../types/database";

export class PropertiesService {
  static async getPropertyById(id: string): Promise<PropertyWithImages | null> {
    try {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (propertyError || !property) {
        console.error("Error fetching property:", propertyError);
        return null;
      }

      const { data: images } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id)
        .order("display_order", { ascending: true });

      const primaryImage = images?.find(img => img.is_primary);
      
      return {
        ...property,
        images: images || [],
        primary_image: primaryImage?.image_url
      };
    } catch (error) {
      console.error("Error in getPropertyById:", error);
      return null;
    }
  }

  static async getFeaturedProperties(limit: number = 5): Promise<PropertyListing[]> {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*, profiles!properties_agent_id_fkey(full_name, phone, agency_name)")
        .eq("featured", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching featured properties:", error);
        return [];
      }

      // Get primary images for each property
      const propertyIds = properties.map(p => p.id);
      const { data: images } = await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", propertyIds)
        .eq("is_primary", true);

      const imageMap = new Map(images?.map(img => [img.property_id, img.image_url]) || []);

      return properties.map((property) => ({
        ...property,
        primary_image: imageMap.get(property.id),
        agent_name: property.profiles?.full_name,
        agent_phone: property.profiles?.phone,
        agency_name: property.profiles?.agency_name,
      }));
    } catch (error) {
      console.error("Error in getFeaturedProperties:", error);
      return [];
    }
  }

  static async getRecentProperties(limit: number = 8): Promise<PropertyListing[]> {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*, profiles!properties_agent_id_fkey(full_name, phone, agency_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching recent properties:", error);
        return [];
      }

      // Get primary images
      const propertyIds = properties.map(p => p.id);
      const { data: images } = await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", propertyIds)
        .eq("is_primary", true);

      const imageMap = new Map(images?.map(img => [img.property_id, img.image_url]) || []);

      return properties.map((property) => ({
        ...property,
        primary_image: imageMap.get(property.id),
        agent_name: property.profiles?.full_name,
        agent_phone: property.profiles?.phone,
        agency_name: property.profiles?.agency_name,
      }));
    } catch (error) {
      console.error("Error in getRecentProperties:", error);
      return [];
    }
  }

  static async getPropertySuggestions(propertyId: string, limit: number = 4): Promise<PropertyListing[]> {
    try {
      const { data: currentProperty } = await supabase
        .from("properties")
        .select("city, property_type, price")
        .eq("id", propertyId)
        .single();

      if (!currentProperty) return [];

      const { data: properties, error } = await supabase
        .from("properties")
        .select("*, profiles!properties_agent_id_fkey(full_name, phone, agency_name)")
        .neq("id", propertyId)
        .eq("status", "active")
        .eq("city", currentProperty.city)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching suggested properties:", error);
        return [];
      }

      // Get primary images
      const propertyIds = properties.map(p => p.id);
      const { data: images } = await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", propertyIds)
        .eq("is_primary", true);

      const imageMap = new Map(images?.map(img => [img.property_id, img.image_url]) || []);

      return properties.map((property) => ({
        ...property,
        primary_image: imageMap.get(property.id),
        agent_name: property.profiles?.full_name,
        agent_phone: property.profiles?.phone,
        agency_name: property.profiles?.agency_name,
      }));
    } catch (error) {
      console.error("Error in getPropertySuggestions:", error);
      return [];
    }
  }

  static async searchProperties(params: SearchParams): Promise<{
    properties: PropertyListing[];
    total_count: number;
    has_more: boolean;
  }> {
    try {
      let query = supabase
        .from("properties")
        .select("*, profiles!properties_agent_id_fkey(full_name, phone, agency_name)", { count: "exact" })
        .eq("status", "active");

      // Apply filters based on new schema
      if (params.search_text) {
        query = query.or(`title.ilike.%${params.search_text}%,description.ilike.%${params.search_text}%,address.ilike.%${params.search_text}%`);
      }
      if (params.city) {
        query = query.ilike("city", `%${params.city}%`);
      }
      if (params.property_type) {
        query = query.eq("property_type", params.property_type);
      }
      if (params.listing_type) {
        query = query.eq("listing_type", params.listing_type);
      }
      if (params.min_price !== undefined) {
        query = query.gte("price", params.min_price);
      }
      if (params.max_price !== undefined) {
        query = query.lte("price", params.max_price);
      }
      if (params.min_bedrooms !== undefined) {
        query = query.gte("bedrooms", params.min_bedrooms);
      }
      if (params.has_pool) {
        query = query.eq("has_pool", true);
      }
      if (params.has_garden) {
        query = query.eq("has_garden", true);
      }
      if (params.is_furnished) {
        query = query.eq("is_furnished", true);
      }
      if (params.featured_only) {
        query = query.eq("featured", true);
      }

      // Pagination
      const limit = params.limit || 12;
      const offset = params.offset || 0;
      query = query
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: properties, error, count } = await query;

      if (error) {
        console.error("Error searching properties:", error);
        return { properties: [], total_count: 0, has_more: false };
      }

      // Get primary images
      const propertyIds = properties.map(p => p.id);
      const { data: images } = await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", propertyIds)
        .eq("is_primary", true);

      const imageMap = new Map(images?.map(img => [img.property_id, img.image_url]) || []);

      const propertiesWithImages = properties.map((property) => ({
        ...property,
        primary_image: imageMap.get(property.id),
        agent_name: property.profiles?.full_name,
        agent_phone: property.profiles?.phone,
        agency_name: property.profiles?.agency_name,
      }));

      return {
        properties: propertiesWithImages,
        total_count: count || 0,
        has_more: offset + properties.length < (count || 0),
      };
    } catch (error) {
      console.error("Error in searchProperties:", error);
      return { properties: [], total_count: 0, has_more: false };
    }
  }

  static async createProperty(data: PropertyFormData, userId: string): Promise<Property | null> {
    try {
      const { images, ...propertyData } = data;

      const { data: newProperty, error: propertyError } = await supabase
        .from("properties")
        .insert({
          ...propertyData,
          agent_id: userId,
          status: "active",
          views_count: 0,
          featured: false,
          parking_spaces: propertyData.parking_spaces || 0,
          is_furnished: propertyData.is_furnished || false,
          has_pool: propertyData.has_pool || false,
          has_garden: propertyData.has_garden || false,
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
            const fileExt = file.name.split(".").pop();
            const fileName = `${newProperty.id}/${Date.now()}_${index}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from("property-images")
              .upload(fileName, file);

            if (uploadError) {
              console.error("Error uploading image:", uploadError);
              return null;
            }

            const { data: publicUrlData } = supabase.storage
              .from("property-images")
              .getPublicUrl(fileName);

            return {
              property_id: newProperty.id,
              image_url: publicUrlData.publicUrl,
              is_primary: index === 0,
              display_order: index,
            };
          })
        );

        const validImages = imageInserts.filter(img => img !== null);

        if (validImages.length > 0) {
          const { error: imagesError } = await supabase
            .from("property_images")
            .insert(validImages);

          if (imagesError) {
            console.error("Error saving image metadata:", imagesError);
          }
        }
      }

      return newProperty;
    } catch (error) {
      console.error("Error in createProperty:", error);
      return null;
    }
  }

  static async recordPropertyView(propertyId: string): Promise<void> {
    try {
      // First get current views count
      const { data: property } = await supabase
        .from("properties")
        .select("views_count")
        .eq("id", propertyId)
        .single();
      
      if (property) {
        // Then update with incremented value
        await supabase
          .from("properties")
          .update({ views_count: (property.views_count || 0) + 1 })
          .eq("id", propertyId);
      }
    } catch (error) {
      console.error("Error recording property view:", error);
    }
  }

  static async getPropertiesByAgent(agentId: string): Promise<PropertyListing[]> {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*, profiles!properties_agent_id_fkey(full_name, phone, agency_name)")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching agent properties:", error);
        return [];
      }

      // Get primary images
      const propertyIds = properties.map(p => p.id);
      const { data: images } = await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", propertyIds)
        .eq("is_primary", true);

      const imageMap = new Map(images?.map(img => [img.property_id, img.image_url]) || []);

      return properties.map((property) => ({
        ...property,
        primary_image: imageMap.get(property.id),
        agent_name: property.profiles?.full_name,
        agent_phone: property.profiles?.phone,
        agency_name: property.profiles?.agency_name,
      }));
    } catch (error) {
      console.error("Error in getPropertiesByAgent:", error);
      return [];
    }
  }

  static async deleteProperty(propertyId: string): Promise<boolean> {
    try {
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

  static async getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
    try {
      let propertiesQuery = supabase
        .from("properties")
        .select("*", { count: "exact" });

      if (role === "agent") {
        propertiesQuery = propertiesQuery.eq("agent_id", userId);
      }

      const { data: properties, count: totalCount } = await propertiesQuery;

      const activeProperties = properties?.filter(p => p.status === "active") || [];
      
      // Get inquiries
      const { data: inquiries } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get featured properties
      let featuredQuery = supabase
        .from("properties")
        .select("*, profiles!properties_agent_id_fkey(full_name, phone, agency_name)")
        .eq("featured", true)
        .eq("status", "active")
        .limit(5);

      if (role === "agent") {
        featuredQuery = featuredQuery.eq("agent_id", userId);
      }

      const { data: featuredProperties } = await featuredQuery;

      // Get primary images for featured properties
      const featuredIds = featuredProperties?.map(p => p.id) || [];
      const { data: featuredImages } = await supabase
        .from("property_images")
        .select("property_id, image_url")
        .in("property_id", featuredIds)
        .eq("is_primary", true);

      const featuredImageMap = new Map(featuredImages?.map(img => [img.property_id, img.image_url]) || []);

      const featuredWithImages = (featuredProperties || []).map(property => ({
        ...property,
        primary_image: featuredImageMap.get(property.id),
        agent_name: property.profiles?.full_name,
        agent_phone: property.profiles?.phone,
        agency_name: property.profiles?.agency_name,
      }));

      return {
        total_properties: totalCount || 0,
        active_properties: activeProperties.length,
        total_inquiries: inquiries?.length || 0,
        recent_inquiries: inquiries || [],
        featured_properties: featuredWithImages,
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
}