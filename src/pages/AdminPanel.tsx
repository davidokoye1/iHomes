import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  // MapPin, 
  Home, 
  // Settings, 
  // Plus, 
  Trash2, 
  // Edit, 
  X,
  Search,
  // Building,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  // Calendar,
  // DollarSign,
  Activity
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types/database';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: 'apartment' | 'house' | 'condo' | 'townhouse' | 'villa' | 'land' | 'commercial';
  listing_type: 'sale' | 'rent';
  status: 'active' | 'pending' | 'sold' | 'inactive';
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  agent_id: string;
  featured: boolean;
  views_count: number;
  created_at: string;
  agent?: {
    full_name: string;
    email: string;
  };
  primary_image?: string;
}

interface Inquiry {
  id: string;
  property_id: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone: string;
  message: string;
  status: string;
  created_at: string;
  property?: {
    title: string;
    address: string;
    city: string;
  };
  agent?: {
    full_name: string;
    email: string;
  };
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'properties' | 'inquiries' | 'analytics'>('dashboard');
  const [users, setUsers] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalAgents: 0,
    totalInquiries: 0,
    activeProperties: 0,
    pendingProperties: 0,
    soldProperties: 0,
    totalViews: 0,
    featuredProperties: 0,
    newUsersThisMonth: 0,
    newPropertiesThisMonth: 0,
    revenueThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'property' | 'inquiry'>('user');

  useEffect(() => {
    checkAdminPermissions();
  }, []);

  const checkAdminPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setCurrentUser(profile);
      fetchData();
    } catch (error) {
      console.error('Permission check error:', error);
      navigate('/login');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(usersData || []);

      // Fetch properties with agent info
      const { data: propertiesData } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!properties_agent_id_fkey(full_name, email),
          property_images!left(image_url, is_primary)
        `)
        .order('created_at', { ascending: false });

      const processedProperties = propertiesData?.map(property => ({
        ...property,
        primary_image: property.property_images?.find((img: any) => img.is_primary)?.image_url
      })) || [];

      setProperties(processedProperties);

      // Fetch inquiries
      const { data: inquiriesData } = await supabase
        .from('inquiries')
        .select(`
          *,
          property:properties(title, address, city),
          agent:profiles!inquiries_agent_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      setInquiries(inquiriesData || []);

      // Calculate stats
      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      const { count: agentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent');

      const { count: inquiryCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true });

      const { count: activeCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: pendingCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: soldCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sold');

      const { count: featuredCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true);

      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString());

      const { count: newPropertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString());

      // Calculate total views
      const { data: viewsData } = await supabase
        .from('properties')
        .select('views_count');
      
      const totalViews = viewsData?.reduce((sum, property) => sum + (property.views_count || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalProperties: propertyCount || 0,
        totalAgents: agentCount || 0,
        totalInquiries: inquiryCount || 0,
        activeProperties: activeCount || 0,
        pendingProperties: pendingCount || 0,
        soldProperties: soldCount || 0,
        totalViews,
        featuredProperties: featuredCount || 0,
        newUsersThisMonth: newUsersCount || 0,
        newPropertiesThisMonth: newPropertiesCount || 0,
        revenueThisMonth: 0 // This would need a transactions table
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete all their properties and data.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'agent' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: 'active' | 'pending' | 'sold' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));
      alert('Property status updated successfully');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Failed to update property status');
    }
  };

  const handleToggleFeatured = async (propertyId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ featured: !featured })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.map(p => p.id === propertyId ? { ...p, featured: !featured } : p));
      alert(`Property ${!featured ? 'featured' : 'unfeatured'} successfully`);
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Failed to update property');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.filter(p => p.id !== propertyId));
      alert('Property deleted successfully');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);

      if (error) throw error;

      setInquiries(inquiries.map(i => i.id === inquiryId ? { ...i, status: newStatus } : i));
      alert('Inquiry status updated successfully');
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      alert('Failed to update inquiry status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.role === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.inquirer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.inquirer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.property?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your real estate platform</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-green-600">+{stats.newUsersThisMonth} this month</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
                <p className="text-xs text-green-600">+{stats.newPropertiesThisMonth} this month</p>
              </div>
              <Home className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-blue-600">All time</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inquiries</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalInquiries}</p>
                <p className="text-xs text-orange-600">All time</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Property Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Properties</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeProperties}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Properties</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingProperties}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sold Properties</p>
                <p className="text-2xl font-bold text-blue-600">{stats.soldProperties}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured Properties</p>
                <p className="text-2xl font-bold text-purple-600">{stats.featuredProperties}</p>
              </div>
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: Activity },
                { key: 'users', label: 'Users', icon: Users },
                { key: 'properties', label: 'Properties', icon: Home },
                { key: 'inquiries', label: 'Inquiries', icon: MessageSquare },
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
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New user registered</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New property listed</p>
                        <p className="text-xs text-gray-500">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New inquiry received</p>
                        <p className="text-xs text-gray-500">10 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="agent">Agents</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || 'N/A'}
                                </div>
                                {user.agency_name && (
                                  <div className="text-sm text-gray-500">{user.agency_name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value as any)}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                                user.role === 'admin' 
                                  ? 'bg-red-100 text-red-800'
                                  : user.role === 'agent'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="user">User</option>
                              <option value="agent">Agent</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.is_verified ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex gap-2">
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div>
                <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProperties.map((property) => (
                        <tr key={property.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                {property.primary_image ? (
                                  <img
                                    src={property.primary_image}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Home className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {property.title}
                                  {property.featured && (
                                    <Star className="inline h-4 w-4 text-yellow-400 ml-1" />
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {property.address}, {property.city}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {property.property_type} • {property.listing_type}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              D{property.price.toLocaleString()}
                              {property.listing_type === 'rent' && <span className="text-gray-500">/month</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{property.agent?.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{property.agent?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={property.status}
                              onChange={(e) => handleUpdatePropertyStatus(property.id, e.target.value as any)}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                                property.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : property.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : property.status === 'sold'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="sold">Sold</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {property.views_count.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleFeatured(property.id, property.featured)}
                                className={`${property.featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                                title={property.featured ? 'Remove from featured' : 'Make featured'}
                              >
                                <Star className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/property/${property.id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Property"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(property.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Property"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div>
                <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search inquiries..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inquirer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInquiries.map((inquiry) => (
                        <tr key={inquiry.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{inquiry.inquirer_name}</div>
                              <div className="text-sm text-gray-500">{inquiry.inquirer_email}</div>
                              {inquiry.inquirer_phone && (
                                <div className="text-sm text-gray-500">{inquiry.inquirer_phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {inquiry.property?.title || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {inquiry.property?.address}, {inquiry.property?.city}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{inquiry.agent?.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{inquiry.agent?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={inquiry.status}
                              onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value)}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                                inquiry.status === 'new' 
                                  ? 'bg-red-100 text-red-800'
                                  : inquiry.status === 'contacted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingItem(inquiry);
                                setEditType('inquiry');
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Platform Analytics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Agents</p>
                          <p className="text-3xl font-bold">{stats.totalAgents}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Active Listings</p>
                          <p className="text-3xl font-bold">{stats.activeProperties}</p>
                        </div>
                        <Home className="h-8 w-8 text-green-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Total Views</p>
                          <p className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
                        </div>
                        <Eye className="h-8 w-8 text-purple-200" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold mb-4">Property Status Distribution</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Active</span>
                          <span className="text-sm font-medium">{stats.activeProperties} ({((stats.activeProperties / stats.totalProperties) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(stats.activeProperties / stats.totalProperties) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pending</span>
                          <span className="text-sm font-medium">{stats.pendingProperties} ({((stats.pendingProperties / stats.totalProperties) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${(stats.pendingProperties / stats.totalProperties) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sold</span>
                          <span className="text-sm font-medium">{stats.soldProperties} ({((stats.soldProperties / stats.totalProperties) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(stats.soldProperties / stats.totalProperties) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold mb-4">User Role Distribution</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Regular Users</span>
                          <span className="text-sm font-medium">{stats.totalUsers - stats.totalAgents - 1}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Agents</span>
                          <span className="text-sm font-medium">{stats.totalAgents}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Admins</span>
                          <span className="text-sm font-medium">1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit/View Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editType === 'inquiry' ? 'Inquiry Details' : 'Item Details'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editType === 'inquiry' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inquirer Name
                    </label>
                    <p className="text-sm text-gray-900">{editingItem.inquirer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{editingItem.inquirer_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900">{editingItem.inquirer_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <p className="text-sm text-gray-900">{new Date(editingItem.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property
                  </label>
                  <p className="text-sm text-gray-900">
                    {editingItem.property?.title} - {editingItem.property?.address}, {editingItem.property?.city}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">{editingItem.message}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditingItem({ ...editingItem, status: newStatus });
                      handleUpdateInquiryStatus(editingItem.id, newStatus);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button variant="white" onClick={() => setShowEditModal(false)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;