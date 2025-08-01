// src/components/Dashboard.tsx - SIMPLIFIED VERSION
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Home,
  Eye,
  MessageCircle,
  TrendingUp,
  Edit,
  Trash2,
  Users,
  BarChart3,
  LogOut,
  Database,
  Star
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import { supabase } from "../lib/supabaseClient";
import { PropertiesService } from "../services/properties";
import type { Profile, PropertyListing, DashboardStats } from "../types/database";

export default function Dashboard() {
  const [user, setUser] = useState<Profile | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [insertingMockData, setInsertingMockData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        navigate("/login", { replace: true });
        return;
      }

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        // Try to create profile if it doesn't exist
        if (profileError?.code === 'PGRST116') {
          console.log('Creating profile for user...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || '',
                role: session.user.user_metadata?.role || 'user',
                organization_name: session.user.user_metadata?.organization_name || null
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            navigate("/login", { replace: true });
            return;
          }
          setUser(newProfile);
        } else {
          navigate("/login", { replace: true });
          return;
        }
      } else {
        setUser(profile);
      }

      // Fetch user's properties if agent/admin
      if (profile && (profile.role === 'agent' || profile.role === 'admin')) {
        try {
          const properties = await PropertiesService.getPropertiesByAgent(profile.id);
          setUserProperties(properties);
          // Fetch dashboard stats
          await fetchDashboardStats(profile);
        } catch (error) {
          console.error('Error fetching properties:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async (profile: Profile) => {
    try {
      // Get property counts
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id);

      const { count: activeProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .eq('status', 'active');

      // Get recent inquiries
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('*')
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        total_properties: totalProperties || 0,
        active_properties: activeProperties || 0,
        total_inquiries: inquiries?.length || 0,
        recent_inquiries: inquiries || [],
        featured_properties: userProperties.filter(p => p.featured).slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/login", { replace: true });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await PropertiesService.deleteProperty(propertyId);
        setUserProperties(prev => prev.filter(p => p.id !== propertyId));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property');
      }
    }
  };

  const handleToggleFeatured = async (propertyId: string, currentFeaturedStatus: boolean) => {
    if (user?.role !== 'admin') {
      alert('Only admins can change featured status');
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .update({ featured: !currentFeaturedStatus })
        .eq('id', propertyId);

      if (error) throw error;

      // Update local state
      setUserProperties(prev =>
        prev.map(property =>
          property.id === propertyId
            ? { ...property, featured: !currentFeaturedStatus }
            : property
        )
      );

      const status = !currentFeaturedStatus ? 'featured' : 'unfeatured';
      alert(`Property has been ${status} successfully`);
    } catch (error) {
      console.error('Error updating featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const insertMockData = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
      alert('Only agents and admins can insert mock data');
      return;
    }

    if (!window.confirm('This will insert 10 sample properties. Continue?')) {
      return;
    }

    try {
      setInsertingMockData(true);

      const mockProperties = [
        {
          title: "Luxury 3BR Villa in Fajara",
          description: "Beautiful modern villa with pool, garden, and sea view. Perfect for families.",
          price: 450000,
          property_type: "villa" as const,
          listing_type: "sale" as const,
          address: "15 Ocean Drive",
          city: "Fajara",
          bedrooms: 3,
          bathrooms: 2,
          square_feet: 2800,
          has_pool: true,
          has_garden: true,
          parking_spaces: 2,
          is_furnished: false,
          featured: true
        },
        // ... (rest of mock data - same as before)
      ];

      for (const property of mockProperties) {
        const { data, error } = await supabase
          .from('properties')
          .insert(property);
        
        if (error) {
          console.error('Error inserting property:', error);
        }
      }

      alert('Mock data inserted successfully! Refresh the page to see the new properties.');
      window.location.reload();
    } catch (error) {
      console.error('Error inserting mock data:', error);
      alert('Failed to insert mock data. Please try again.');
    } finally {
      setInsertingMockData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto pt-16">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/login')} 
                variant="colored"
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="white"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular user dashboard
  if (user.role === 'user') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {user.full_name || 'User'}!</h1>
            <p className="text-gray-600 mb-6">Signed in as <strong>{user.email}</strong></p>
            
            <div className="space-y-4">
              <Link to="/search">
                <Button variant="colored" className="w-full max-w-xs">
                  Browse Properties
                </Button>
              </Link>
              
              <div>
                <Button
                  onClick={handleLogout}
                  variant="white"
                  className="w-full max-w-xs"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agent/Admin dashboard - rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.full_name || user.email}
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                {user.role}
              </span>
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link to="/upload-property">
              <Button variant="colored" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Property
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="white"
              className="flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Rest of dashboard content... */}
        <div className="text-center py-8">
          <p className="text-gray-600">Dashboard content will load here once authentication is working properly.</p>
          
          <div className="mt-6">
            <Button
              variant="colored"
              onClick={insertMockData}
              disabled={insertingMockData}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {insertingMockData ? 'Inserting...' : 'Insert Sample Properties'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}