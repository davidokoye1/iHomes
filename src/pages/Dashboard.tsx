// src/components/Dashboard.tsx - Enterprise-Grade Agent Dashboard
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Home,
  Eye,
  MessageCircle,
  TrendingUp,
  // Edit,
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
  Settings,
  Filter,
  Search,
  Download,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  RefreshCw,
  ArrowUpRight,
  // ArrowDownRight,
  Target,
  Award,
  Zap,
  Activity,
  ChevronRight,
  ChevronDown,
  X,
  SortAsc,
  SortDesc,
  Grid,
  List
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { supabase } from "../lib/supabaseClient";
import { PropertiesService } from "../services/properties";
import type { Profile, PropertyListing, DashboardStats, Inquiry, PropertyStatus } from "../types/database";
import { toast } from "sonner";

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'price' | 'views_count' | 'title' | 'status';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'pending' | 'sold' | 'inactive';

export default function Dashboard() {
  const [user, setUser] = useState<Profile | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyListing[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [insertingMockData, setInsertingMockData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'inquiries' | 'analytics' | 'reports'>('overview');

  // Property management states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndData();
  }, []);

  // Filter and sort properties
  useEffect(() => {
    let filtered = [...userProperties];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.property_type.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof PropertyListing];
      let bVal: any = b[sortField as keyof PropertyListing];

      if (sortField === 'price' || sortField === 'views_count') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProperties(filtered);
  }, [userProperties, filterStatus, searchQuery, sortField, sortDirection]);

  // Computed statistics
  const computedStats = useMemo(() => {
    if (!userProperties.length) return null;

    const totalViews = userProperties.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const avgViews = Math.round(totalViews / userProperties.length);
    const totalValue = userProperties.reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = Math.round(totalValue / userProperties.length);

    const statusCounts = userProperties.reduce((acc, p) => {
      acc[p.status as PropertyStatus] = (acc[p.status as PropertyStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const newThisMonth = userProperties.filter(p => {
      const created = new Date(p.created_at);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    return {
      totalViews,
      avgViews,
      totalValue,
      avgPrice,
      statusCounts,
      newThisMonth,
      conversionRate: recentInquiries.length > 0 ? Math.round((recentInquiries.filter(i => i.status === 'closed').length / recentInquiries.length) * 100) : 0
    };
  }, [userProperties, recentInquiries]);

  const fetchUserAndData = async () => {
    try {
      setRefreshing(true);

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
                  email_confirmed: true
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
          const properties = await PropertiesService.getPropertiesByAgent(profile.id);
          setUserProperties(properties);

          const dashboardStats = await PropertiesService.getDashboardStats(profile.id, profile.role);
          setStats(dashboardStats);
          setRecentInquiries(dashboardStats.recent_inquiries);
        } catch (error) {
          console.error('Error fetching properties and stats:', error);
          toast.error('Failed to load dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    const propertyTitle = userProperties.find(p => p.id === propertyId)?.title || 'this property';

    if (window.confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      try {
        const success = await PropertiesService.deleteProperty(propertyId);
        if (success) {
          setUserProperties(prev => prev.filter(p => p.id !== propertyId));
          setSelectedProperties(prev => prev.filter(id => id !== propertyId));
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

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedProperties.length} selected properties? This action cannot be undone.`)) {
      try {
        const promises = selectedProperties.map(id => PropertiesService.deleteProperty(id));
        const results = await Promise.all(promises);
        const successCount = results.filter(Boolean).length;

        if (successCount > 0) {
          setUserProperties(prev => prev.filter(p => !selectedProperties.includes(p.id)));
          setSelectedProperties([]);
          toast.success(`Successfully deleted ${successCount} properties`);

          if (user) {
            const updatedStats = await PropertiesService.getDashboardStats(user.id, user.role);
            setStats(updatedStats);
          }
        }

        if (successCount < selectedProperties.length) {
          toast.error(`Failed to delete ${selectedProperties.length - successCount} properties`);
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        toast.error('Failed to delete properties');
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

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      const success = await PropertiesService.updatePropertyStatus(propertyId, newStatus);
      if (success) {
        setUserProperties(prev =>
            prev.map(property =>
                property.id === propertyId
                    ? { ...property, status: newStatus as PropertyStatus }
                    : property
            )
        );
        toast.success(`Property status updated to ${newStatus}`);

        if (user) {
          const updatedStats = await PropertiesService.getDashboardStats(user.id, user.role);
          setStats(updatedStats);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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

      await fetchUserAndData();

    } catch (error) {
      console.error('Error inserting mock data:', error);
      toast.error('Failed to insert sample data. Please try again.');
    } finally {
      setInsertingMockData(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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

  const exportData = () => {
    const dataToExport = filteredProperties.map(p => ({
      title: p.title,
      price: p.price,
      status: p.status as PropertyStatus,
      type: p.property_type,
      listing_type: p.listing_type,
      city: p.city,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      views: p.views_count,
      created: new Date(p.created_at).toLocaleDateString()
    }));

    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `properties-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Properties exported successfully');
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Agent Dashboard
                </h1>
                {refreshing && <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />}
              </div>
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

            <div className="flex gap-3 mt-4 lg:mt-0">
              <Button
                  onClick={fetchUserAndData}
                  variant="white"
                  className="flex items-center gap-2"
                  disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total_properties || 0}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {computedStats?.newThisMonth || 0} this month
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Properties</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.active_properties || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.total_properties ? Math.round((stats.active_properties / stats.total_properties) * 100) : 0}% of total
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Views</p>
                  <p className="text-3xl font-bold text-purple-600">{computedStats?.totalViews?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg {computedStats?.avgViews || 0} per property
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Portfolio Value</p>
                  <p className="text-3xl font-bold text-yellow-600">D{computedStats?.totalValue?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg D{computedStats?.avgPrice?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                {[
                  { key: 'overview', label: 'Overview', icon: BarChart3, count: null },
                  { key: 'properties', label: 'Properties', icon: Home, count: userProperties.length },
                  { key: 'inquiries', label: 'Inquiries', icon: MessageCircle, count: recentInquiries.length },
                  { key: 'analytics', label: 'Analytics', icon: TrendingUp, count: null },
                  { key: 'reports', label: 'Reports', icon: FileText, count: null }
                ].map(({ key, label, icon: Icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
                            activeTab === key
                                ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        } transition-colors`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      {count !== null && (
                          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                              activeTab === key
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-gray-200 text-gray-600'
                          }`}>
                      {count}
                    </span>
                      )}
                    </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Enhanced Overview Tab */}
              {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Performance Metrics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Performance Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">Conversion Rate</span>
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-blue-900">{computedStats?.conversionRate || 0}%</p>
                          <p className="text-xs text-blue-700">Inquiries to resolution</p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-900">Featured Properties</span>
                            <Star className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-green-900">{stats?.featured_properties?.length || 0}</p>
                          <p className="text-xs text-green-700">Premium listings</p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Avg Response Time</span>
                            <Clock className="h-4 w-4 text-purple-600" />
                          </div>
                          <p className="text-2xl font-bold text-purple-900">2.4h</p>
                          <p className="text-xs text-purple-700">To client inquiries</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-green-600" />
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link to="/upload-property">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-200 group">
                            <Plus className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-semibold text-green-900 mb-1">Add Property</h4>
                            <p className="text-sm text-green-700">Create new listing</p>
                          </div>
                        </Link>

                        <button
                            onClick={insertMockData}
                            disabled={insertingMockData}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-left disabled:opacity-50 group"
                        >
                          <Database className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                          <h4 className="font-semibold text-blue-900 mb-1">
                            {insertingMockData ? 'Adding...' : 'Sample Data'}
                          </h4>
                          <p className="text-sm text-blue-700">Generate test properties</p>
                        </button>

                        <Link to="/search">
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group">
                            <Eye className="h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-semibold text-purple-900 mb-1">Browse Market</h4>
                            <p className="text-sm text-purple-700">View all listings</p>
                          </div>
                        </Link>

                        <button
                            onClick={exportData}
                            className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-left group"
                        >
                          <Download className="h-8 w-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                          <h4 className="font-semibold text-orange-900 mb-1">Export Data</h4>
                          <p className="text-sm text-orange-700">Download CSV report</p>
                        </button>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Recent Inquiries */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            Recent Inquiries
                          </h3>
                          <Link to="#" onClick={() => setActiveTab('inquiries')}>
                            <Button variant="white" className="text-sm">
                              View All
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>

                        {recentInquiries.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-6 text-center">
                              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">No recent inquiries</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {recentInquiries.slice(0, 3).map((inquiry) => (
                                  <div key={inquiry.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                          {inquiry.inquirer_name}
                                        </h4>
                                        <p className="text-xs text-gray-600">{inquiry.inquirer_email}</p>
                                      </div>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          inquiry.status === 'new'
                                              ? 'bg-red-100 text-red-800'
                                              : inquiry.status === 'contacted'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-green-100 text-green-800'
                                      }`}>
                                {inquiry.status}
                              </span>
                                    </div>
                                    <p className="text-sm text-gray-800 mb-2 line-clamp-2">{inquiry.message}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{inquiry.property_id}</span>
                                      <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )}
                      </div>

                      {/* Top Performing Properties */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Award className="h-5 w-5 text-green-600" />
                            Top Performers
                          </h3>
                          <Link to="#" onClick={() => setActiveTab('properties')}>
                            <Button variant="white" className="text-sm">
                              View All
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>

                        {userProperties.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-6 text-center">
                              <Home className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">No properties yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {userProperties
                                  .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                                  .slice(0, 3)
                                  .map((property) => (
                                      <div key={property.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                          {property.primary_image ? (
                                              <img
                                                  src={property.primary_image}
                                                  alt={property.title}
                                                  className="w-12 h-12 object-cover rounded-lg"
                                              />
                                          ) : (
                                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <Home className="h-6 w-6 text-gray-400" />
                                              </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 text-sm truncate">
                                              {property.title}
                                            </h4>
                                            <p className="text-xs text-gray-600">
                                              D{property.price?.toLocaleString()} • {property.city}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {property.views_count} views
                                  </span>
                                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(property.status as PropertyStatus)}`}>
                                    {property.status}
                                  </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                  ))}
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
              )}

              {/* Enhanced Properties Tab */}
              {activeTab === 'properties' && (
                  <div>
                    {/* Properties Header with Controls */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Home className="h-5 w-5 text-green-600" />
                          My Properties ({filteredProperties.length})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage and track your property listings
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {selectedProperties.length > 0 && (
                            <Button
                                onClick={handleBulkDelete}
                                variant="white"
                                className="text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete ({selectedProperties.length})
                            </Button>
                        )}

                        <Button
                            onClick={exportData}
                            variant="white"
                            className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>

                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="white"
                            className="flex items-center gap-2"
                        >
                          <Filter className="h-4 w-4" />
                          Filters
                          {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>

                        <Link to="/upload-property">
                          <Button variant="colored" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Property
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                  type="text"
                                  placeholder="Search properties..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              {searchQuery && (
                                  <button
                                      onClick={() => setSearchQuery('')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                              )}
                            </div>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="all">All Status</option>
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="sold">Sold</option>
                              <option value="inactive">Inactive</option>
                            </select>

                            {/* Sort Field */}
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as SortField)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="created_at">Date Created</option>
                              <option value="price">Price</option>
                              <option value="views_count">Views</option>
                              <option value="title">Title</option>
                              <option value="status">Status</option>
                            </select>

                            {/* Sort Direction & View Mode */}
                            <div className="flex gap-2">
                              <button
                                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                              >
                                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                              </button>

                              <button
                                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                              >
                                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                    )}

                    {/* Properties List/Grid */}
                    {filteredProperties.length === 0 ? (
                        <div className="text-center py-12">
                          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {userProperties.length === 0 ? 'No properties yet' : 'No properties match your filters'}
                          </h3>
                          <p className="text-gray-600 mb-6">
                            {userProperties.length === 0
                                ? 'Start by adding your first property listing'
                                : 'Try adjusting your search criteria'
                            }
                          </p>
                          <div className="flex justify-center gap-4">
                            {userProperties.length === 0 ? (
                                <>
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
                                </>
                            ) : (
                                <Button
                                    variant="white"
                                    onClick={() => {
                                      setFilterStatus('all');
                                      setSearchQuery('');
                                    }}
                                >
                                  Clear Filters
                                </Button>
                            )}
                          </div>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "space-y-4"
                        }>
                          {filteredProperties.map((property) => (
                              <div key={property.id} className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 ${
                                  viewMode === 'list' ? 'flex' : ''
                              }`}>
                                {/* Property Image */}
                                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                                  {property.primary_image ? (
                                      <img
                                          src={property.primary_image}
                                          alt={property.title}
                                          className={`object-cover ${viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'}`}
                                      />
                                  ) : (
                                      <div className={`bg-gray-200 flex items-center justify-center ${viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'}`}>
                                        <Home className="h-12 w-12 text-gray-400" />
                                      </div>
                                  )}

                                  {/* Property Badges */}
                                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                                    {property.featured && (
                                        <span className="bg-yellow-500 text-yellow-900 px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Featured
                              </span>
                                    )}
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusColor(property.status)}`}>
                              {getStatusIcon(property.status as PropertyStatus)}
                              {property.status as PropertyStatus}
                            </span>
                                  </div>

                                  {/* Selection Checkbox */}
                                  <div className="absolute top-3 right-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedProperties.includes(property.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedProperties(prev => [...prev, property.id]);
                                          } else {
                                            setSelectedProperties(prev => prev.filter(id => id !== property.id));
                                          }
                                        }}
                                        className="w-4 h-4 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500"
                                    />
                                  </div>
                                </div>

                                {/* Property Details */}
                                <div className="p-4 flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                                      {property.title}
                                    </h3>
                                    <button
                                        onClick={() => copyToClipboard(window.location.origin + `/property/${property.id}`)}
                                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                                        title="Copy property link"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="flex items-center text-gray-600 mb-3">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span className="text-sm">{property.address}, {property.city}</span>
                                  </div>

                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center text-green-600 font-bold text-lg">
                                      <DollarSign className="h-5 w-5" />
                                      <span>D{property.price?.toLocaleString()}</span>
                                      {property.listing_type === 'rent' && <span className="text-sm text-gray-500 ml-1">/month</span>}
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      {(property.bedrooms || 0) > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bed className="h-4 w-4" />
                                          <span>{property.bedrooms}</span>
                                        </div>
                                      )}
                                      {(property.bathrooms || 0) > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bath className="h-4 w-4" />
                                          <span>{property.bathrooms}</span>
                                        </div>
                                      )}
                                      {(property.square_feet || 0) > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Square className="h-4 w-4" />
                                          <span>{property.square_feet?.toLocaleString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Property Stats */}
                                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-4 w-4" />
                                      <span>{property.views_count || 0} views</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>{new Date(property.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>

                                  {/* Property Actions */}
                                  <div className="flex flex-wrap gap-2">
                                    <Link to={`/property/${property.id}`} className="flex-1">
                                      <Button variant="white" className="w-full text-sm">
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </Link>

                                    <Link to={`/property/${property.id}`}>
                                      <Button variant="white" className="px-3">
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </Link>

                                    {/* Status Change Dropdown */}
                                    <select
                                        value={property.status}
                                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                      <option value="active">Active</option>
                                      <option value="pending">Pending</option>
                                      <option value="sold">Sold</option>
                                      <option value="inactive">Inactive</option>
                                    </select>

                                    {user.role === 'admin' && (
                                        <Button
                                            variant="white"
                                            className="px-3"
                                            onClick={() => handleToggleFeatured(property.id, property.featured)}
                                        >
                                          <Star className={`h-4 w-4 ${property.featured ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                                        </Button>
                                    )}

                                    <Button
                                        variant="white"
                                        className="px-3 text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteProperty(property.id)}
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

              {/* Enhanced Inquiries Tab */}
              {activeTab === 'inquiries' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        Property Inquiries ({recentInquiries.length})
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="white" className="text-sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                        <Button variant="white" className="text-sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {recentInquiries.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
                          <p className="text-gray-600">Inquiries about your properties will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                          {recentInquiries.map((inquiry) => (
                              <div key={inquiry.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-gray-900">{inquiry.inquirer_name}</h4>
                                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                          inquiry.status === 'new'
                                              ? 'bg-red-100 text-red-800'
                                              : inquiry.status === 'contacted'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-green-100 text-green-800'
                                      }`}>
                                {inquiry.status}
                              </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        <a href={`mailto:${inquiry.inquirer_email}`} className="hover:text-green-600">
                                          {inquiry.inquirer_email}
                                        </a>
                                      </div>
                                      {inquiry.inquirer_phone && (
                                          <div className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            <a href={`tel:${inquiry.inquirer_phone}`} className="hover:text-green-600">
                                              {inquiry.inquirer_phone}
                                            </a>
                                          </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button variant="white" className="text-sm">
                                      <Mail className="h-4 w-4 mr-1" />
                                      Reply
                                    </Button>
                                    <select
                                        value={inquiry.status}
                                        onChange={(e) => {
                                          // Handle status change
                                          console.log('Status change:', e.target.value);
                                        }}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                      <option value="new">New</option>
                                      <option value="contacted">Contacted</option>
                                      <option value="resolved">Resolved</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className="text-gray-800 bg-gray-50 rounded-lg p-3">{inquiry.message}</p>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium">Property ID: {inquiry.property_id}</span>
                                    <Link to={`/property/${inquiry.property_id}`} className="text-green-600 hover:text-green-700 flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3" />
                                      View Property
                                    </Link>
                                  </div>
                                  <span>{new Date(inquiry.created_at).toLocaleDateString()} • {new Date(inquiry.created_at).toLocaleTimeString()}</span>
                                </div>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
              )}

              {/* Enhanced Analytics Tab */}
              {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Analytics & Insights
                    </h3>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Property Performance</h4>
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Views</span>
                            <span className="font-semibold">
                          {computedStats?.totalViews?.toLocaleString() || 0}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Views</span>
                            <span className="font-semibold">
                          {computedStats?.avgViews || 0}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Featured Properties</span>
                            <span className="font-semibold text-yellow-600">
                          {userProperties.filter(p => p.featured).length}
                        </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Property Status</h4>
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Active</span>
                            <span className="font-semibold text-green-600">
                          {computedStats?.statusCounts?.active || 0}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pending</span>
                            <span className="font-semibold text-yellow-600">
                          {computedStats?.statusCounts?.pending || 0}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sold</span>
                            <span className="font-semibold text-blue-600">
                          {computedStats?.statusCounts?.sold || 0}
                        </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Market Value</h4>
                          <DollarSign className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Portfolio Value</span>
                            <span className="font-semibold">
                          D{computedStats?.totalValue?.toLocaleString() || 0}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Price</span>
                            <span className="font-semibold">
                          D{computedStats?.avgPrice?.toLocaleString() || 0}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Price Range</span>
                            <span className="font-semibold text-purple-600">
                          {userProperties.length > 0 ? 'D' + Math.min(...userProperties.map(p => p.price || 0)).toLocaleString() + ' - D' + Math.max(...userProperties.map(p => p.price || 0)).toLocaleString() : 'N/A'}
                        </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Inquiry Stats</h4>
                          <MessageCircle className="h-5 w-5 text-orange-600" />
                        </div>
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
                            <span className="text-sm text-gray-600">Conversion Rate</span>
                            <span className="font-semibold text-orange-600">
                          {computedStats?.conversionRate || 0}%
                        </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Charts Placeholder */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Property Views Over Time</h4>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Chart visualization would go here</p>
                            <p className="text-sm text-gray-500">Integration with charting library needed</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Property Type Distribution</h4>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Pie chart would go here</p>
                            <p className="text-sm text-gray-500">Shows breakdown by property type</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analytics */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Top Performing Properties</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Property</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Views</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Inquiries</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-900">Price</th>
                          </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                          {userProperties
                              .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                              .slice(0, 5)
                              .map((property) => (
                                  <tr key={property.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        {property.primary_image ? (
                                            <img
                                                src={property.primary_image}
                                                alt={property.title}
                                                className="w-10 h-10 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                              <Home className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                          <p className="font-medium text-gray-900 truncate max-w-xs">{property.title}</p>
                                          <p className="text-gray-600">{property.city}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4 text-gray-400" />
                                        {property.views_count || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1">
                                        <MessageCircle className="h-4 w-4 text-gray-400" />
                                        {recentInquiries.filter(i => i.property_id === property.id).length}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status as PropertyStatus)}`}>
                                {property.status as PropertyStatus}
                              </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                      D{property.price?.toLocaleString()}
                                    </td>
                                  </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
              )}

              {/* Enhanced Reports Tab */}
              {activeTab === 'reports' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Reports & Exports
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Property Report */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Home className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Property Report</h4>
                            <p className="text-sm text-gray-600">Detailed property listing report</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Properties:</span>
                            <span className="font-medium">{userProperties.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Active Listings:</span>
                            <span className="font-medium text-green-600">{stats?.active_properties || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Value:</span>
                            <span className="font-medium">D{computedStats?.totalValue?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        <Button
                            onClick={exportData}
                            variant="colored"
                            className="w-full text-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>

                      {/* Performance Report */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Performance Report</h4>
                            <p className="text-sm text-gray-600">Views and engagement metrics</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Views:</span>
                            <span className="font-medium">{computedStats?.totalViews?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg per Property:</span>
                            <span className="font-medium">{computedStats?.avgViews || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">This Month:</span>
                            <span className="font-medium text-green-600">{computedStats?.newThisMonth || 0} new</span>
                          </div>
                        </div>
                        <Button variant="white" className="w-full text-sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                      </div>

                      {/* Inquiry Report */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <MessageCircle className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Inquiry Report</h4>
                            <p className="text-sm text-gray-600">Customer interaction summary</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Inquiries:</span>
                            <span className="font-medium">{recentInquiries.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Response Rate:</span>
                            <span className="font-medium text-purple-600">{computedStats?.conversionRate || 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">New This Week:</span>
                            <span className="font-medium">
                          {recentInquiries.filter(i => {
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return new Date(i.created_at) > weekAgo;
                          }).length}
                        </span>
                          </div>
                        </div>
                        <Button variant="white" className="w-full text-sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Inquiries
                        </Button>
                      </div>
                    </div>

                    {/* Custom Report Builder */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Custom Report Builder</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 3 months</option>
                            <option>Last year</option>
                            <option>All time</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <option>Summary Report</option>
                            <option>Detailed Property Report</option>
                            <option>Performance Analytics</option>
                            <option>Inquiry Analysis</option>
                            <option>Financial Summary</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <option>CSV</option>
                            <option>PDF</option>
                            <option>Excel</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <Button variant="colored" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Generate Report
                        </Button>
                        <Button variant="white" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
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