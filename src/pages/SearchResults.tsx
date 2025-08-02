// src/pages/SearchResults.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Grid,
  List,
  X,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  DollarSign,
  Loader2,
  AlertCircle,
  Star,
  Filter,
  ChevronDown,
  SortAsc,
  SortDesc,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Button from '../components/Button';
import { PropertiesService } from '../services/properties';
import type {
  PropertyListing,
  SearchParams,
  Amenity,
  SearchResult
} from '../types/database';

/**
 * SearchResults Component - Main property search page
 * Handles property filtering, searching, and display with pagination
 */
const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Core search data state
  const [properties, setProperties] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filter state with proper typing
  const [filters, setFilters] = useState<SearchParams>({});
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  /**
   * Load amenities data on component mount
   * Used for filter options in the amenities section
   */
  useEffect(() => {
    const loadAmenities = async () => {
      try {
        const amenitiesData = await PropertiesService.getAmenities();
        setAmenities(amenitiesData);
      } catch (err) {
        console.error('Error loading amenities:', err);
        toast.error('Failed to load search filters', {
          description: 'Some search features may not work properly'
        });
      }
    };

    loadAmenities();
  }, []);

  /**
   * Initialize filters from URL parameters
   * Ensures filters persist across page refreshes and browser navigation
   */
  useEffect(() => {
    const initialFilters: SearchParams = {
      search_text: searchParams.get('search_text') || undefined,
      property_type: (searchParams.get('property_type') as PropertyListing['property_type']) || undefined,
      listing_type: (searchParams.get('listing_type') as PropertyListing['listing_type']) || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      min_bedrooms: searchParams.get('min_bedrooms') ? Number(searchParams.get('min_bedrooms')) : undefined,
      max_bedrooms: searchParams.get('max_bedrooms') ? Number(searchParams.get('max_bedrooms')) : undefined,
      min_bathrooms: searchParams.get('min_bathrooms') ? Number(searchParams.get('min_bathrooms')) : undefined,
      max_bathrooms: searchParams.get('max_bathrooms') ? Number(searchParams.get('max_bathrooms')) : undefined,
      city: searchParams.get('city') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      amenity_ids: searchParams.getAll('amenity_ids').filter(id => id),
      featured_only: searchParams.get('featured') === 'true',
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: searchParams.get('sort_order') || undefined
    };

    setFilters(initialFilters);
    performSearch(initialFilters, 1);
  }, [searchParams]);

  /**
   * Main search function that calls the backend service
   * Handles parameter mapping and error states
   */
  const performSearch = useCallback(async (searchFilters: SearchParams, currentPage: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * limit;

      // Map frontend parameters to backend service expectations
      const searchParams = {
        search_text: searchFilters.search_text || '',
        property_type: searchFilters.property_type || undefined,
        listing_type: searchFilters.listing_type || undefined,
        min_price: searchFilters.min_price ? Number(searchFilters.min_price) : undefined,
        max_price: searchFilters.max_price ? Number(searchFilters.max_price) : undefined,
        min_bedrooms: searchFilters.min_bedrooms ? Number(searchFilters.min_bedrooms) : undefined,
        max_bedrooms: searchFilters.max_bedrooms ? Number(searchFilters.max_bedrooms) : undefined,
        min_bathrooms: searchFilters.min_bathrooms ? Number(searchFilters.min_bathrooms) : undefined,
        max_bathrooms: searchFilters.max_bathrooms ? Number(searchFilters.max_bathrooms) : undefined,
        city: searchFilters.city || undefined,
        location_id: searchFilters.location_id || undefined,
        amenity_ids: searchFilters.amenity_ids && searchFilters.amenity_ids.length > 0 ? searchFilters.amenity_ids : undefined,
        featured_only: searchFilters.featured_only || false,
        sort_by: searchFilters.sort_by || 'created_at',
        sort_order: searchFilters.sort_order || 'DESC',
        limit,
        offset
      };

      console.log("🔍 Search Parameters (Frontend):", searchParams);

      const result = await PropertiesService.searchProperties(searchParams);

      // Process and validate property data
      const processedProperties = result.properties.map(p => ({
        ...p,
        price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
        bedrooms: p.bedrooms || 0,
        bathrooms: p.bathrooms || 0,
        square_feet: p.square_feet || 0
      }));

      // Handle pagination - append or replace results based on page
      if (currentPage === 1) {
        setProperties(processedProperties);
      } else {
        setProperties(prev => [...prev, ...processedProperties]);
      }

      setTotalCount(result.total_count);
      setHasMore(result.has_more);
    } catch (error) {
      console.error('❌ Search error:', error);
      setError('Failed to load properties. Please check your internet connection and try again.');
      toast.error('Search failed', {
        description: 'Please check your internet connection'
      });
    } finally {
      setLoading(false);
    }
  }, [limit]);

  /**
   * Handle individual filter changes
   * Updates the filters state without triggering search immediately
   */
  const handleFilterChange = useCallback((key: keyof SearchParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Toggle amenity selection in filters
   * Manages array of selected amenity IDs
   */
  const handleAmenityToggle = useCallback((amenityId: string) => {
    const currentAmenityIds = filters.amenity_ids || [];
    const index = currentAmenityIds.indexOf(amenityId);

    let newAmenityIds;
    if (index === -1) {
      // Add amenity if not already selected
      newAmenityIds = [...currentAmenityIds, amenityId];
    } else {
      // Remove amenity if already selected
      newAmenityIds = currentAmenityIds.filter(id => id !== amenityId);
    }

    handleFilterChange('amenity_ids', newAmenityIds);
  }, [filters, handleFilterChange]);

  /**
   * Apply all current filters and update URL
   * Triggers new search with current filter state
   */
  const applyFilters = useCallback(() => {
    setPage(1);
    const params = new URLSearchParams();

    // Build URL parameters from current filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.set(key, String(value));
        }
      }
    });

    setSearchParams(params);
    performSearch(filters, 1);
    setShowFilters(false);
  }, [filters, performSearch, setSearchParams]);

  /**
   * Clear all filters and reset search
   * Returns to default state with no filters applied
   */
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchParams({});
    setPage(1);
    performSearch({}, 1);
  }, [performSearch, setSearchParams]);

  /**
   * Count active filters for UI badge display
   * Excludes empty, null, undefined, and false values
   */
  const getActiveFilterCount = useCallback(() => {
    return Object.values(filters).filter(v => {
      if (v === undefined || v === null || v === '' || v === false) return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }).length;
  }, [filters]);

  /**
   * Handle sort option selection
   * Updates sort parameters and triggers new search
   */
  const handleSort = useCallback((sortBy: string, sortOrder: string = 'DESC') => {
    const newFilters = { ...filters, sort_by: sortBy, sort_order: sortOrder };
    setFilters(newFilters);
    setPage(1);

    // Update URL immediately
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.set(key, String(value));
        }
      }
    });

    setSearchParams(params);
    performSearch(newFilters, 1);
    setShowSortMenu(false);
  }, [filters, performSearch, setSearchParams]);

  // Configuration arrays for filter options
  const propertyTypes = [
    { value: '', label: 'All Types', icon: Home },
    { value: 'apartment', label: 'Apartment', icon: Building2 },
    { value: 'house', label: 'House', icon: Home },
    { value: 'condo', label: 'Condo', icon: Building2 },
    { value: 'townhouse', label: 'Townhouse', icon: Home },
    { value: 'villa', label: 'Villa', icon: Home },
    { value: 'land', label: 'Land', icon: Square },
    { value: 'commercial', label: 'Commercial', icon: Building2 }
  ];

  const priceRanges = [
    { label: 'Any Price', min: undefined, max: undefined },
    { label: 'Under D50,000', min: undefined, max: 50000 },
    { label: 'D50,000 - D100,000', min: 50000, max: 100000 },
    { label: 'D100,000 - D200,000', min: 100000, max: 200000 },
    { label: 'D200,000 - D500,000', min: 200000, max: 500000 },
    { label: 'D500,000 - D1,000,000', min: 500000, max: 1000000 },
    { label: 'Above D1,000,000', min: 1000000, max: undefined },
  ];

  const bedroomOptions = [
    { label: 'Any', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
    { label: '5+', value: 5 },
  ];

  const bathroomOptions = [
    { label: 'Any', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
    { label: '5+', value: 5 },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'created_at', order: 'DESC' },
    { label: 'Oldest First', value: 'created_at', order: 'ASC' },
    { label: 'Price: Low to High', value: 'price', order: 'ASC' },
    { label: 'Price: High to Low', value: 'price', order: 'DESC' },
    { label: 'Most Viewed', value: 'views_count', order: 'DESC' },
    { label: 'Featured First', value: 'featured', order: 'DESC' },
  ];

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Enhanced Search Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col gap-4">
              {/* Main Search Bar */}
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                      type="text"
                      placeholder="Search properties, locations, or features..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      value={filters.search_text || ''}
                      onChange={(e) => handleFilterChange('search_text', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <button
                      onClick={() => setShowFilters(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors relative group"
                  >
                    <Filter className="h-5 w-5" />
                    <span className="hidden sm:inline">Filters</span>
                    {getActiveFilterCount() > 0 && (
                        <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {getActiveFilterCount()}
                    </span>
                    )}
                  </button>

                  <Button
                      variant="colored"
                      onClick={applyFilters}
                      className="px-8 py-3 font-medium"
                      disabled={loading}
                  >
                    {loading ? (
                        <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                    ) : 'Search'}
                  </Button>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => {
                      handleFilterChange('listing_type', filters.listing_type === 'sale' ? undefined : 'sale');
                      setTimeout(applyFilters, 100);
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                        filters.listing_type === 'sale'
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  For Sale
                </button>
                <button
                    onClick={() => {
                      handleFilterChange('listing_type', filters.listing_type === 'rent' ? undefined : 'rent');
                      setTimeout(applyFilters, 100);
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                        filters.listing_type === 'rent'
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  For Rent
                </button>
                <button
                    onClick={() => {
                      handleFilterChange('featured_only', !filters.featured_only);
                      setTimeout(applyFilters, 100);
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                        filters.featured_only
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                >
                  <Star className="h-4 w-4 inline mr-1" />
                  Featured
                </button>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
          )}

          {/* Results Header with Enhanced Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {totalCount > 0 ? (
                    <>
                      {totalCount.toLocaleString()} {totalCount === 1 ? 'Property' : 'Properties'} Found
                    </>
                ) : (
                    'No Properties Found'
                )}
              </h1>
              {filters.city && (
                  <p className="text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    in {filters.city}
                  </p>
              )}

              {/* Active Filters Display */}
              {getActiveFilterCount() > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.property_type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-md">
                    {propertyTypes.find(t => t.value === filters.property_type)?.label}
                          <button onClick={() => {
                            handleFilterChange('property_type', undefined);
                            setTimeout(applyFilters, 100);
                          }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                    )}
                    {filters.min_bedrooms && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-md">
                    {filters.min_bedrooms}+ bedrooms
                    <button onClick={() => {
                      handleFilterChange('min_bedrooms', undefined);
                      setTimeout(applyFilters, 100);
                    }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                    )}
                    {(filters.min_price || filters.max_price) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-md">
                    Price: {filters.min_price ? `D${filters.min_price.toLocaleString()}` : '0'} - {filters.max_price ? `D${filters.max_price.toLocaleString()}` : '∞'}
                          <button onClick={() => {
                            handleFilterChange('min_price', undefined);
                            handleFilterChange('max_price', undefined);
                            setTimeout(applyFilters, 100);
                          }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                    )}
                  </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SortAsc className="h-4 w-4" />
                  <span className="hidden sm:inline">Sort</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showSortMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {sortOptions.map((option) => (
                          <button
                              key={`${option.value}-${option.order}`}
                              onClick={() => handleSort(option.value, option.order)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                          >
                            {option.label}
                          </button>
                      ))}
                    </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">View:</span>
                <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                  <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                          viewMode === 'grid'
                              ? 'bg-green-600 text-white'
                              : 'text-gray-400 hover:text-gray-600'
                      }`}
                      aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                          viewMode === 'list'
                              ? 'bg-green-600 text-white'
                              : 'text-gray-400 hover:text-gray-600'
                      }`}
                      aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Click outside to close sort menu */}
          {showSortMenu && (
              <div
                  className="fixed inset-0 z-5"
                  onClick={() => setShowSortMenu(false)}
              />
          )}

          {/* Results Display */}
          {loading && properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-6"></div>
                <h3 className="text-xl font-medium text-gray-700">Finding the perfect properties...</h3>
                <p className="text-gray-500 mt-2">This may take a moment</p>
              </div>
          ) : properties.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties match your search</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try adjusting your search criteria or clearing some filters to find more results.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="colored" onClick={clearAllFilters} className="px-6">
                    Clear All Filters
                  </Button>
                  <Button variant="white" onClick={() => navigate('/')} className="px-6 border-gray-300">
                    Back to Home
                  </Button>
                </div>
              </div>
          ) : (
              <>
                {/* Properties Grid/List */}
                <div className={`grid ${
                    viewMode === 'grid'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-1'
                } gap-6 mb-8`}>
                  {properties.map((property) => (
                      <ListingCard
                          key={property.id}
                          id={property.id}
                          imageUrl={property.primary_image || '/placeholder-property.jpg'}
                          price={property.price}
                          bedrooms={property.bedrooms || 0}
                          bathrooms={property.bathrooms || 0}
                          addressLine1={property.address}
                          addressLine2={`${property.city}${property.location?.region ? `, ${property.location.region}` : ''}`}
                          propertyType={property.property_type}
                          listingType={property.listing_type}
                          featured={property.featured}
                      />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="flex justify-center">
                      <Button
                          variant="colored"
                          onClick={() => {
                            const nextPage = page + 1;
                            setPage(nextPage);
                            performSearch(filters, nextPage);
                          }}
                          disabled={loading}
                          className="px-8 py-3 text-lg font-medium"
                      >
                        {loading ? (
                            <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                        ) : (
                            `Load More Properties (${Math.min(limit, totalCount - properties.length)} remaining)`
                        )}
                      </Button>
                    </div>
                )}
              </>
          )}
        </div>

        {/* Enhanced Filters Modal */}
        {showFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Property Filters</h3>
                    <p className="text-gray-600 mt-1">Narrow down your search to find the perfect property</p>
                  </div>
                  <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Property Type */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Home className="h-5 w-5 text-green-600" />
                        Property Type
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {propertyTypes.map((type) => {
                          const IconComponent = type.icon;
                          return (
                              <button
                                  key={type.value}
                                  onClick={() => handleFilterChange('property_type', type.value || undefined)}
                                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                                      filters.property_type === type.value
                                          ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
                                          : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                  }`}
                              >
                                <IconComponent className="h-4 w-4" />
                                <span className="text-sm">{type.label}</span>
                              </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Listing Type */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Listing Type
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleFilterChange('listing_type', undefined)}
                            className={`px-4 py-3 rounded-xl border transition-all duration-200 text-center ${
                                !filters.listing_type
                                    ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
                                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
                            }`}
                        >
                          All
                        </button>
                        <button
                            onClick={() => handleFilterChange('listing_type', 'sale')}
                            className={`px-4 py-3 rounded-xl border transition-all duration-200 text-center ${
                                filters.listing_type === 'sale'
                                    ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
                                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
                            }`}
                        >
                          For Sale
                        </button>
                        <button
                            onClick={() => handleFilterChange('listing_type', 'rent')}
                            className={`px-4 py-3 rounded-xl border transition-all duration-200 text-center ${
                                filters.listing_type === 'rent'
                                    ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
                                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
                            }`}
                        >
                          For Rent
                        </button>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Price Range
                      </h4>
                      <select
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                          value={priceRanges.findIndex(range =>
                              range.min === filters.min_price && range.max === filters.max_price
                          )}
                          onChange={(e) => {
                            const range = priceRanges[Number(e.target.value)];
                            handleFilterChange('min_price', range.min);
                            handleFilterChange('max_price', range.max);
                          }}
                      >
                        {priceRanges.map((range, idx) => (
                            <option key={idx} value={idx}>{range.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bedrooms */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Bed className="h-5 w-5 text-green-600" />
                        Bedrooms
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {bedroomOptions.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => handleFilterChange('min_bedrooms', option.value)}
                                className={`px-4 py-3 rounded-xl border transition-all duration-200 text-center ${
                                    filters.min_bedrooms === option.value
                                        ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
                                        : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                }`}
                            >
                              {option.label}
                            </button>
                        ))}
                      </div>
                    </div>

                    {/* Bathrooms */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Bath className="h-5 w-5 text-green-600" />
                        Bathrooms
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {bathroomOptions.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => handleFilterChange('min_bathrooms', option.value)}
                                className={`px-4 py-3 rounded-xl border transition-all duration-200 text-center ${
                                    filters.min_bathrooms === option.value
                                        ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
                                        : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                }`}
                            >
                              {option.label}
                            </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        Location
                      </h4>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Enter city or area..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                            value={filters.city || ''}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amenities Section - Full Width */}
                  <div className="mt-8 space-y-4">
                    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <Star className="h-5 w-5 text-green-600" />
                      Amenities
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {amenities.map((amenity) => (
                          <label
                              key={amenity.id}
                              className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-gray-300"
                          >
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                checked={filters.amenity_ids?.includes(amenity.id) || false}
                                onChange={() => handleAmenityToggle(amenity.id)}
                            />
                            <span className="text-sm text-gray-700 flex-1">{amenity.name}</span>
                          </label>
                      ))}
                    </div>
                    {amenities.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No amenities available</p>
                    )}
                  </div>

                  {/* Featured Properties Toggle */}
                  <div className="mt-8">
                    <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl cursor-pointer hover:from-green-100 hover:to-blue-100 transition-colors border border-green-200">
                      <input
                          type="checkbox"
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          checked={filters.featured_only || false}
                          onChange={(e) => handleFilterChange('featured_only', e.target.checked)}
                      />
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-green-600" />
                        <div>
                          <h5 className="font-semibold text-gray-900">Featured Properties Only</h5>
                          <p className="text-sm text-gray-600">Show only our premium featured properties</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t bg-gray-50 flex gap-3">
                  <Button
                      variant="white"
                      onClick={clearAllFilters}
                      className="flex-1 py-3 text-base font-medium border-gray-300"
                  >
                    Clear All Filters
                  </Button>
                  <Button
                      variant="colored"
                      onClick={applyFilters}
                      className="flex-1 py-3 text-base font-medium"
                      disabled={loading}
                  >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </span>
                    ) : (
                        `Apply Filters${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default SearchResults;