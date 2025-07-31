// src/components/Dashboard.tsx
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
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (error || !profile) {
        navigate("/login");
        return;
      }

      setUser(profile);

      // Fetch user's properties if agent/admin
      if (profile.role === 'agent' || profile.role === 'admin') {
        const properties = await PropertiesService.getPropertiesByAgent(profile.id);
        setUserProperties(properties);

        // Fetch dashboard stats
        await fetchDashboardStats(profile);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate("/login");
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
    await supabase.auth.signOut();
    navigate("/login");
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
        {
          title: "Modern 2BR Apartment in Serekunda",
          description: "Contemporary apartment with modern amenities in the heart of Serekunda.",
          price: 25000,
          property_type: "apartment" as const,
          listing_type: "rent" as const,
          address: "42 Mosque Road",
          city: "Serekunda",
          bedrooms: 2,
          bathrooms: 1,
          square_feet: 1200,
          is_furnished: true,
          has_pool: false,
          has_garden: false,
          parking_spaces: 0
        },
        {
          title: "Family House in Bakau",
          description: "Spacious family home with large compound and fruit trees.",
          price: 280000,
          property_type: "house" as const,
          listing_type: "sale" as const,
          address: "28 Cape Point Road",
          city: "Bakau",
          bedrooms: 4,
          bathrooms: 3,
          square_feet: 2200,
          has_garden: true,
          has_pool: false,
          is_furnished: false,
          parking_spaces: 1
        },
        {
          title: "Beachfront Condo in Kololi",
          description: "Stunning beachfront condominium with direct beach access and resort amenities.",
          price: 380000,
          property_type: "condo" as const,
          listing_type: "sale" as const,
          address: "7 Senegambia Strip",
          city: "Kololi",
          bedrooms: 2,
          bathrooms: 2,
          square_feet: 1800,
          has_pool: true,
          has_garden: false,
          is_furnished: true,
          parking_spaces: 1,
          featured: true
        },
        {
          title: "Commercial Plot in Banjul",
          description: "Prime commercial land in central Banjul, perfect for business development.",
          price: 150000,
          property_type: "land" as const,
          listing_type: "sale" as const,
          address: "Independence Drive",
          city: "Banjul",
          square_feet: 5000,
          has_pool: false,
          has_garden: false,
          is_furnished: false,
          parking_spaces: 0
        },
        {
          title: "Cozy 1BR Studio in Kairaba",
          description: "Perfect starter home or investment property in quiet residential area.",
          price: 18000,
          property_type: "apartment" as const,
          listing_type: "rent" as const,
          address: "12 Kairaba Avenue",
          city: "Kairaba",
          bedrooms: 1,
          bathrooms: 1,
          square_feet: 650,
          is_furnished: true,
          has_pool: false,
          has_garden: false,
          parking_spaces: 0
        },
        {
          title: "Executive Townhouse in Fajara",
          description: "Elegant townhouse in exclusive gated community with 24/7 security.",
          price: 520000,
          property_type: "townhouse" as const,
          listing_type: "sale" as const,
          address: "5 Atlantic Boulevard",
          city: "Fajara",
          bedrooms: 4,
          bathrooms: 3,
          square_feet: 3200,
          has_pool: true,
          has_garden: true,
          is_furnished: false,
          parking_spaces: 2,
          featured: true
        },
        {
          title: "Budget-Friendly 2BR House",
          description: "Affordable family home in developing neighborhood with good transport links.",
          price: 180000,
          property_type: "house" as const,
          listing_type: "sale" as const,
          address: "67 Westfield Road",
          city: "Serekunda",
          bedrooms: 2,
          bathrooms: 1,
          square_feet: 1000,
          has_garden: true,
          has_pool: false,
          is_furnished: false,
          parking_spaces: 0
        },
        {
          title: "Luxury Rental in Kololi",
          description: "High-end furnished apartment in tourist area, ideal for short-term rentals.",
          price: 45000,
          property_type: "apartment" as const,
          listing_type: "rent" as const,
          address: "15 Senegambia Hotel Road",
          city: "Kololi",
          bedrooms: 3,
          bathrooms: 2,
          square_feet: 1600,
          is_furnished: true,
          has_pool: true,
          has_garden: false,
          parking_spaces: 1
        },
        {
          title: "Investment Property in Banjul",
          description: "Multi-unit building perfect for rental income generation.",
          price: 350000,
          property_type: "commercial" as const,
          listing_type: "sale" as const,
          address: "23 Wellington Street",
          city: "Banjul",
          bedrooms: 8,
          bathrooms: 4,
          square_feet: 4000,
          parking_spaces: 3,
          has_pool: false,
          has_garden: false,
          is_furnished: false
        }
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
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <Button onClick={() => navigate('/login')} variant="colored">
            Login
          </Button>
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

  // Agent/Admin dashboard
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_properties}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Listings</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active_properties}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>


            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inquiries</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.total_inquiries}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Properties List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Properties</h2>
                <Link to="/upload-property">
                  <Button variant="white" className="text-sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add New
                  </Button>
                </Link>
              </div>
              
              {userProperties.length === 0 ? (
                <div className="p-8 text-center">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first property listing</p>
                  <Link to="/upload-property">
                    <Button variant="colored">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {userProperties.map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <img
                            src={property.primary_image || '/placeholder-property.jpg'}
                            alt={property.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{property.title}</h3>
                              {property.featured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{property.address}, {property.city}</p>
                            <p className="text-lg font-semibold text-blue-600">
                              D{property.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            property.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {property.status}
                          </span>

                          {property.featured && (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                          
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleToggleFeatured(property.id, property.featured || false)}
                              className={`p-2 hover:bg-gray-100 rounded ${
                                property.featured
                                  ? 'text-yellow-500'
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={property.featured ? 'Remove from featured' : 'Mark as featured'}
                            >
                              <Star className={`h-4 w-4 ${property.featured ? 'fill-current' : ''}`} />
                            </button>
                          )}
                          
                          <Link to={`/property/${property.id}`}>
                            <button className="p-2 text-gray-400 hover:text-blue-600">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteProperty(property.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {userProperties.length === 0 && (
                    <div className="flex justify-center py-8">
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
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Inquiries */}
            <div className="bg-white rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Recent Inquiries</h2>
              </div>
              <div className="p-6">
                {stats?.recent_inquiries.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No inquiries yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats?.recent_inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{inquiry.inquirer_name}</p>
                        <p className="text-xs text-gray-600 truncate">{inquiry.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link to="/upload-property" className="block">
                  <Button variant="white" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Property
                  </Button>
                </Link>
                <Link to="/search" className="block">
                  <Button variant="white" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Button variant="white" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}