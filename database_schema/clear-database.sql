-- This script will drop all public tables in your database.
-- Make sure you have a backup if you need to restore your data.

DROP VIEW IF EXISTS public.recent_properties;
DROP VIEW IF EXISTS public.featured_properties;
DROP VIEW IF EXISTS public.property_listings;

DROP TABLE IF EXISTS public.inquiries;
DROP TABLE IF EXISTS public.property_views;
DROP TABLE IF EXISTS public.searches;
DROP TABLE IF EXISTS public.favorites;
DROP TABLE IF EXISTS public.property_images;
DROP TABLE IF EXISTS public.properties;
DROP TABLE IF EXISTS public.locations;
DROP TABLE IF EXISTS public.profiles;

DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.property_status;
DROP TYPE IF EXISTS public.property_type;
DROP TYPE IF EXISTS public.listing_type;

-- After running this, you can apply the new schema from supabase-schema.sql