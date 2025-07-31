-- =============================================
-- iHomes Real Estate App - Complete Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Schema refresh comment: 2025-07-30T21:54:00Z

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
CREATE TYPE property_status AS ENUM ('active', 'pending', 'sold', 'rented', 'inactive');
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'villa', 'land', 'commercial');
CREATE TYPE listing_type AS ENUM ('sale', 'rent');

-- =============================================
-- TABLES
-- =============================================

-- Users Profile Table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    agency_name TEXT,
    organization_name TEXT,
    license_number TEXT,
    bio TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations Table
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'city', 'town', 'district', 'region'
    parent_id UUID REFERENCES public.locations(id),
    coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties Table
CREATE TABLE public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    property_type property_type NOT NULL,
    listing_type listing_type NOT NULL,
    status property_status DEFAULT 'active',
    
    -- Location
    location_id UUID REFERENCES public.locations(id),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT DEFAULT 'Gambia',
    postal_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Property Details
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    total_rooms INTEGER,
    square_feet INTEGER,
    lot_size INTEGER,
    year_built INTEGER,
    
    -- Features
    parking_spaces INTEGER DEFAULT 0,
    has_garage BOOLEAN DEFAULT FALSE,
    has_pool BOOLEAN DEFAULT FALSE,
    has_garden BOOLEAN DEFAULT FALSE,
    has_balcony BOOLEAN DEFAULT FALSE,
    is_furnished BOOLEAN DEFAULT FALSE,
    has_ac BOOLEAN DEFAULT FALSE,
    has_heating BOOLEAN DEFAULT FALSE,
    pet_friendly BOOLEAN DEFAULT FALSE,
    
    -- Listing Info
    agent_id UUID REFERENCES public.profiles(id) NOT NULL,
    featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Images Table
CREATE TABLE public.property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Searches Table (for search history and analytics)
CREATE TABLE public.searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Views Table (for analytics)
CREATE TABLE public.property_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Inquiries Table
CREATE TABLE public.inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    inquirer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Properties indexes for search performance
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_property_type ON public.properties(property_type);
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_bedrooms ON public.properties(bedrooms);
CREATE INDEX idx_properties_bathrooms ON public.properties(bathrooms);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_location_id ON public.properties(location_id);
CREATE INDEX idx_properties_agent_id ON public.properties(agent_id);
CREATE INDEX idx_properties_featured ON public.properties(featured);
CREATE INDEX idx_properties_created_at ON public.properties(created_at);
CREATE INDEX idx_properties_text_search ON public.properties USING gin(to_tsvector('english', title || ' ' || description || ' ' || address));

-- Location-based search
CREATE INDEX idx_properties_coordinates ON public.properties USING gist(ll_to_earth(latitude, longitude));

-- Other indexes
CREATE INDEX idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX idx_property_images_primary ON public.property_images(property_id, is_primary);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_property_id ON public.favorites(property_id);
CREATE INDEX idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX idx_property_views_created_at ON public.property_views(created_at);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to increment property views
CREATE OR REPLACE FUNCTION increment_property_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.properties 
    SET views_count = views_count + 1 
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for property search
CREATE OR REPLACE FUNCTION search_properties(
    search_query TEXT DEFAULT '',
    property_type_filter property_type DEFAULT NULL,
    listing_type_filter listing_type DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    min_bedrooms INTEGER DEFAULT NULL,
    max_bedrooms INTEGER DEFAULT NULL,
    min_bathrooms DECIMAL DEFAULT NULL,
    max_bathrooms DECIMAL DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    featured_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    property_type property_type,
    listing_type listing_type,
    address TEXT,
    city TEXT,
    bedrooms INTEGER,
    bathrooms DECIMAL,
    square_feet INTEGER,
    agent_id UUID,
    featured BOOLEAN,
    primary_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.property_type,
        p.listing_type,
        p.address,
        p.city,
        p.bedrooms,
        p.bathrooms,
        p.square_feet,
        p.agent_id,
        p.featured,
        pi.image_url as primary_image_url,
        p.created_at
    FROM public.properties p
    LEFT JOIN public.property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
    WHERE 
        p.status = 'active'
        AND (search_query = '' OR to_tsvector('english', p.title || ' ' || p.description || ' ' || p.address) @@ plainto_tsquery('english', search_query))
        AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
        AND (listing_type_filter IS NULL OR p.listing_type = listing_type_filter)
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
        AND (max_bedrooms IS NULL OR p.bedrooms <= max_bedrooms)
        AND (min_bathrooms IS NULL OR p.bathrooms >= min_bathrooms)
        AND (max_bathrooms IS NULL OR p.bathrooms <= max_bathrooms)
        AND (city_filter IS NULL OR LOWER(p.city) LIKE LOWER('%' || city_filter || '%'))
        AND (NOT featured_only OR p.featured = TRUE)
    ORDER BY 
        p.featured DESC,
        p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
-- Function to create a public profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Increment property views
CREATE TRIGGER trigger_increment_property_views AFTER INSERT ON public.property_views FOR EACH ROW EXECUTE PROCEDURE increment_property_views();

-- Trigger to create a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON public.properties FOR SELECT USING (status = 'active');
CREATE POLICY "Agents can insert their own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Admins can manage all properties" ON public.properties FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Property images policies
CREATE POLICY "Anyone can view property images" ON public.property_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND status = 'active')
);
CREATE POLICY "Agents can manage images for their properties" ON public.property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND agent_id = auth.uid())
);
CREATE POLICY "Admins can manage all property images" ON public.property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Searches policies
CREATE POLICY "Users can view their own searches" ON public.searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own searches" ON public.searches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Property views policies
CREATE POLICY "Anyone can insert property views" ON public.property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own property views" ON public.property_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agents can view views for their properties" ON public.property_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND agent_id = auth.uid())
);

-- Inquiries policies
CREATE POLICY "Users can view their own inquiries" ON public.inquiries FOR SELECT USING (auth.uid() = inquirer_id);
CREATE POLICY "Agents can view inquiries for their properties" ON public.inquiries FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Users can insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can update inquiries for their properties" ON public.inquiries FOR UPDATE USING (auth.uid() = agent_id);

-- Locations policies
CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage locations" ON public.locations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert comprehensive Gambian locations
INSERT INTO public.locations (name, type, coordinates) VALUES
-- Western Region
('Banjul', 'Capital City', point(-16.5780, 13.4567)),
('Serekunda', 'City', point(-16.6833, 13.4333)),
('Bakau', 'Town', point(-16.6833, 13.4833)),
('Fajara', 'District', point(-16.6833, 13.5000)),
('Kololi', 'Town', point(-16.7000, 13.4900)),
('Kairaba', 'District', point(-16.6900, 13.4800)),
('Bijilo', 'Village', point(-16.7100, 13.4950)),
('Brufut', 'Village', point(-16.7200, 13.4700)),
('Gunjur', 'Town', point(-16.7300, 13.4000)),
('Tanji', 'Village', point(-16.7400, 13.4200)),
('Sanyang', 'Village', point(-16.7500, 13.4100)),
('Kartong', 'Village', point(-16.7600, 13.3900)),
('Tujereng', 'Village', point(-16.7000, 13.4600)),
('Sukuta', 'Town', point(-16.6700, 13.4400)),
('Yundum', 'Town', point(-16.6500, 13.4200)),

-- North Bank Region
('Kerewan', 'Town', point(-16.0900, 13.4900)),
('Farafenni', 'Town', point(-15.6000, 13.5700)),
('Essau', 'Village', point(-16.5300, 13.5200)),
('Barra', 'Town', point(-16.5400, 13.4800)),
('Amdalai', 'Village', point(-16.0000, 13.4000)),
('Kuntaur', 'Village', point(-14.8800, 13.6700)),

-- Lower River Region
('Mansa Konko', 'Town', point(-15.4500, 13.4300)),
('Soma', 'Town', point(-15.5300, 13.4400)),
('Kaur', 'Village', point(-15.6100, 13.4500)),
('Kwinella', 'Village', point(-15.7000, 13.4600)),

-- Central River Region
('Janjanbureh', 'Town', point(-14.7700, 13.5300)),
('Bansang', 'Town', point(-14.6500, 13.4400)),
('Wassu', 'Village', point(-14.7000, 13.5000)),

-- Upper River Region
('Basse', 'Town', point(-14.2100, 13.3200)),
('Fatoto', 'Village', point(-14.1500, 13.4200)),
('Koina', 'Village', point(-14.3000, 13.3500)),
('Garawol', 'Village', point(-14.2500, 13.3800));

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO public.profiles (id, email, full_name, role, is_verified) VALUES
-- ('your-admin-user-id', 'admin@ihomes.gm', 'System Admin', 'admin', true);

-- =============================================
-- UTILITY VIEWS
-- =============================================

-- View for properties with primary images
CREATE VIEW property_listings AS
SELECT 
    p.*,
    pi.image_url as primary_image_url,
    pr.full_name as agent_name,
    pr.phone as agent_phone,
    pr.email as agent_email
FROM public.properties p
LEFT JOIN public.property_images pi ON p.id = pi.property_id AND pi.is_primary = true
LEFT JOIN public.profiles pr ON p.agent_id = pr.id
WHERE p.status = 'active';

-- View for featured properties
CREATE VIEW featured_properties AS
SELECT * FROM property_listings WHERE featured = true ORDER BY created_at DESC;

-- View for recent properties
CREATE VIEW recent_properties AS
SELECT * FROM property_listings ORDER BY created_at DESC LIMIT 20;

-- =============================================
-- GRANTS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;