// src/components/Dashboard.tsx - Enhanced Professional Version
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
  Star,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import { supabase } from "../lib/supabaseClient";
import { PropertiesService } from "../services/properties";
import type { Profile, PropertyListing, DashboardStats, Inquiry } from "../types/database";
import { toast } from "sonner";

export default function Dashboard() {
  const [user, setUser] = useState<Profile | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [insertingMockData, setInsertingMockData] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'inquiries' | 'analytics'>('overview');
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

      // Check if email is confirmed
      if (!session.user.email_confirmed_at) {
        toast.error("Please confirm your email address to access the dashboard");
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
                agency_name: session.user.user_metadata?.organization_name || null,
                email_confirmed: true // Since they're logged in, email is confirmed
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

      // Fetch user's properties and stats if agent/admin
      if (profile && (profile.role === 'agent' || profile.role === 'admin')) {
        try {
          // Fetch properties
          const properties = await PropertiesService.getPropertiesByAgent(profile.id);
          setUserProperties(properties);
          
          // Fetch dashboard stats
          const dashboardStats = await PropertiesService.getDashboardStats(profile.id, profile.role);
          setStats(dashboardStats);
          setRecentInquiries(dashboardStats.recent_inquiries);
        } catch (error) {
          console.error('Error fetching properties and stats:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        const success = await PropertiesService.deleteProperty(propertyId);
        if (success) {
          setUserProperties(prev => prev.filter(p => p.id !== propertyId));
          toast.success('Property deleted successfully');
          // Refresh stats
          if (user) {
            const updatedStats = await PropertiesService.getDashboardStats(user.id, user.role);
            setStats(updatedStats);
          }
        } else {
          toast.error('Failed to delete property');
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        toast.error('Failed to delete property');
      }
    }
  };

  const handleToggleFeatured = async (propertyId: string, currentFeaturedStatus: boolean) => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can change featured status');
      return;
    }

    try {
      const success = await PropertiesService.toggleFeatured(propertyId, currentFeaturedStatus);
      if (success) {
        // Update local state
        setUserProperties(prev =>
          prev.map(property =>
            property.id === propertyId
              ? { ...property, featured: !currentFeaturedStatus }
              : property
          )
        );

        const status = !currentFeaturedStatus ? 'featured' : 'unfeatured';
        toast.success(`Property has been ${status} successfully`);
      } else {
        toast.error('Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const insertMockData = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
      toast.error('Only agents and admins can insert sample data');
      return;
    }

    if (!window.confirm('This will insert 10 sample properties. Continue?')) {
      return;
    }

    try {
      setInsertingMockData(true);
      
      const count = await PropertiesService.createSampleProperties(user.id);
      
      toast.success(`Successfully created ${count} sample properties!`);
      
      // Refresh data
      await fetchUserAndData();
      
    } catch (error) {
      console.error('Error inserting mock data:', error);
      toast.error('Failed to insert sample data. Please try again.');
    } finally {
      setInsertingMockData(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'sold': return 'text-blue-600 bg-blue-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'sold': return <TrendingUp className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome, {user.full_name || 'User'}!
            </h1>
            <p className="text-gray-600 mb-6">
              Signed in as <strong>{user.email}</strong>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <Link to="/search">
                <Button variant="colored" className="w-full">
                  <Home className="h-5 w-5 mr-2" />
                  Browse Properties
                </Button>
              </Link>
              
              <Link to="/favorites">
                <Button variant="white" className="w-full">
                  <Star className="h-5 w-5 mr-2" />
                  My Favorites
                </Button>
              </Link>
            </div>

            <div className="border-t pt-6">
              <Button
                onClick={handleLogout}
                variant="white"
                className="mx-auto"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
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
              {user.agency_name && (
                <span className="ml-2 text-sm text-gray-500">
                  • {user.agency_name}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link to="/upload-property">
              <Button variant="colored" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Property
              </Button>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin">
                <Button variant="white" className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Admin Panel
                </Button>
              </Link>
            )}
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
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_properties}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Properties</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active_properties}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Featured Properties</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.featured_properties.length}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Inquiries</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.total_inquiries}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'properties', label: 'My Properties', icon: Home },
                { key: 'inquiries', label: 'Inquiries', icon: MessageCircle },
                { key: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                    activeTab === key
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to="/upload-property">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                        <Plus className="h-8 w-8 text-green-600 mb-2" />
                        <h4 className="font-medium text-green-900">Add Property</h4>
                        <p className="text-sm text-green-700">List a new property</p>
                      </div>
                    </Link>
                    
                    <button
                      onClick={insertMockData}
                      disabled={insertingMockData}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
                    >
                      <Database className="h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-medium text-blue-900">
                        {insertingMockData ? 'Adding...' : 'Sample Data'}
                      </h4>
                      <p className="text-sm text-blue-700">Add sample properties</p>
                    </button>
                    
                    <Link to="/search">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors">
                        <Eye className="h-8 w-8 text-purple-600 mb-2" />
                        <h4 className="font-medium text-purple-900">Browse Properties</h4>
                        <p className="text-sm text-purple-700">View all listings</p>
                      </div>
                    </Link>
                    
                    <Link to="/profile">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors">
                        <Users className="h-8 w-8 text-orange-600 mb-2" />
                        <h4 className="font-medium text-orange-900">My Profile</h4>
                        <p className="text-sm text-orange-700">Update your info</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Recent Inquiries */}
                {recentInquiries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Inquiries</h3>
                    <div className="space-y-3">
                      {recentInquiries.map((inquiry) => (
                        <div key={inquiry.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {inquiry.inquirer_name}
                              </h4>
                              <p className="text-sm text-gray-600">{inquiry.inquirer_email}</p>
                              <p className="text-sm text-gray-800 mt-2">{inquiry.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(inquiry.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              inquiry.status === 'new' 
                                ? 'bg-red-100 text-red-800'
                                : inquiry.status === 'contacted'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {inquiry.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">My Properties ({userProperties.length})</h3>
                  <Link to="/upload-property">
                    <Button variant="colored" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Property
                    </Button>
                  </Link>
                </div>

                {userProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                    <p className="text-gray-600 mb-6">Start by adding your first property listing</p>
                    <div className="flex justify-center gap-4">
                      <Link to="/upload-property">
                        <Button variant="colored">Add Property</Button>
                      </Link>
                      <Button 
                        variant="white" 
                        onClick={insertMockData}
                        disabled={insertingMockData}
                      >
                        {insertingMockData ? 'Adding...' : 'Add Sample Data'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userProperties.map((property) => (
                      <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          {property.primary_image ? (
                            <img
                              src={property.primary_image}
                              alt={property.title}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                              <Home className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          
                          {property.featured && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-yellow-400 text-yellow-900 px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Featured
                              </span>
                            </div>
                          )}
                          
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusColor(property.status)}`}>
                              {getStatusIcon(property.status)}
                              {property.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {property.title}
                          </h3>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{property.address}, {property.city}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-green-600 font-semibold">
                              <DollarSign className="h-4 w-4" />
                              <span>D{property.price.toLocaleString()}</span>
                              {property.listing_type === 'rent' && <span className="text-sm text-gray-500">/month</span>}
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              {property.bedrooms > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bed className="h-4 w-4" />
                                  <span>{property.bedrooms}</span>
                                </div>
                              )}
                              {property.bathrooms > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bath className="h-4 w-4" />
                                  <span>{property.bathrooms}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{property.views_count} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(property.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link to={`/property/${property.id}`} className="flex-1">
                              <Button variant="white" className="w-full text-sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            
                            {user.role === 'admin' && (
                              <Button
                                variant="white"
                                className="px-3"
                                onClick={() => handleToggleFeatured(property.id, property.featured)}
                                title={property.featured ? "Remove from featured" : "Make featured"}
                              >
                                <Star className={`h-4 w-4 ${property.featured ? 'text-yellow-500' : 'text-gray-400'}`} />
                              </Button>
                            )}
                            
                            <Button
                              variant="white"
                              className="px-3 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteProperty(property.id)}
                              title="Delete property"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Property Inquiries</h3>
                
                {recentInquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
                    <p className="text-gray-600">Inquiries about your properties will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{inquiry.inquirer_name}</h4>
                            <p className="text-sm text-gray-600">{inquiry.inquirer_email}</p>
                            {inquiry.inquirer_phone && (
                              <p className="text-sm text-gray-600">{inquiry.inquirer_phone}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            inquiry.status === 'new' 
                              ? 'bg-red-100 text-red-800'
                              : inquiry.status === 'contacted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {inquiry.status}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-800">{inquiry.message}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Property: {inquiry.property?.title}</span>
                          <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Property Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Views</span>
                        <span className="font-semibold">
                          {userProperties.reduce((sum, p) => sum + p.views_count, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Views</span>
                        <span className="font-semibold">
                          {userProperties.length > 0 
                            ? Math.round(userProperties.reduce((sum, p) => sum + p.views_count, 0) / userProperties.length)
                            : 0
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Featured Properties</span>
                        <span className="font-semibold">
                          {userProperties.filter(p => p.featured).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Property Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active</span>
                        <span className="font-semibold text-green-600">
                          {userProperties.filter(p => p.status === 'active').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="font-semibold text-yellow-600">
                          {userProperties.filter(p => p.status === 'pending').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sold</span>
                        <span className="font-semibold text-blue-600">
                          {userProperties.filter(p => p.status === 'sold').length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Inquiry Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Inquiries</span>
                        <span className="font-semibold">{stats?.total_inquiries || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Month</span>
                        <span className="font-semibold">
                          {recentInquiries.filter(i => 
                            new Date(i.created_at).getMonth() === new Date().getMonth()
                          ).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Response Rate</span>
                        <span className="font-semibold">
                          {recentInquiries.length > 0 
                            ? Math.round((recentInquiries.filter(i => i.status !== 'new').length / recentInquiries.length) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}