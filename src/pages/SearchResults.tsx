import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Grid, 
  List, 
  X, 
  SlidersHorizontal,
  MapPin,
  Home,
  DollarSign,
  Bed,
  Square,
  Car,
  Droplets,
  Trees,
  Sofa
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Button from '../components/Button';
import { PropertiesService } from '../services/properties';
import type { PropertyListing, SearchParams } from '../types/database';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchParams>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const limit = 12;

  // Property type options
  const propertyTypes = [
    { value: '', label: 'All Types', icon: Home },
    { value: 'apartment', label: 'Apartment', icon: Home },
    { value: 'house', label: 'House', icon: Home },
    { value: 'condo', label: 'Condo', icon: Home },
    { value: 'townhouse', label: 'Townhouse', icon: Home },
    { value: 'villa', label: 'Villa', icon: Home },
    { value: 'land', label: 'Land', icon: Square },
    { value: 'commercial', label: 'Commercial', icon: Home }
  ];

  // Price ranges
  const priceRanges = [
    { label: 'Any Price', min: undefined, max: undefined },
    { label: 'Under D50,000', min: undefined, max: 50000 },
    { label: 'D50,000 - D100,000', min: 50000, max: 100000 },
    { label: 'D100,000 - D200,000', min: 100000, max: 200000 },
    { label: 'D200,000 - D500,000', min: 200000, max: 500000 },
    { label: 'D500,000 - D1,000,000', min: 500000, max: 1000000 },
    { label: 'Above D1,000,000', min: 1000000, max: undefined },
  ];

  // Bedroom options
  const bedroomOptions = [
    { label: 'Any', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
    { label: '5+', value: 5 },
  ];

  useEffect(() => {
    const initialFilters: SearchParams = {
      search_text: searchParams.get('search_text') || undefined,
      property_type: searchParams.get('property_type') as any || undefined,
      listing_type: searchParams.get('listing_type') as any || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      min_bedrooms: searchParams.get('min_bedrooms') ? Number(searchParams.get('min_bedrooms')) : undefined,
      city: searchParams.get('city') || undefined,
      featured_only: searchParams.get('featured') === 'true',
      has_pool: searchParams.get('has_pool') === 'true',
      has_garden: searchParams.get('has_garden') === 'true',
      is_furnished: searchParams.get('is_furnished') === 'true',
    };
    setFilters(initialFilters);
    performSearch(initialFilters, 1);
  }, [searchParams]);

  const performSearch = async (searchFilters: SearchParams, currentPage: number = 1) => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      
      const result = await PropertiesService.searchProperties({
        ...searchFilters,
        limit,
        offset
      });

      if (currentPage === 1) {
        setProperties(result.properties || []);
      } else {
        setProperties(prev => [...prev, ...(result.properties || [])]);
      }
      
      setTotalCount(result.total_count || 0);
      setHasMore(result.has_more || false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    setPage(1);
    
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
    performSearch(filters, 1);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchParams({});
    performSearch({}, 1);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== undefined && v !== null && v !== '' && v !== false).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description or address..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.search_text || ''}
                onChange={(e) => handleFilterChange('search_text', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors relative"
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span className="hidden sm:inline">Filters</span>
                {getActiveFilterCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              
              <Button variant="colored" onClick={applyFilters} className="px-8 py-3">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {totalCount} Properties Found
            </h1>
            {filters.city && (
              <p className="text-gray-600 mt-1">in {filters.city}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">View:</span>
            <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
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
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && properties.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Search className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your search criteria or clearing some filters.</p>
            <Button variant="colored" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className={`grid ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            } gap-6`}>
              {properties.map((property) => (
                <ListingCard
                  key={property.id}
                  id={property.id}
                  imageUrl={property.primary_image || '/placeholder-property.jpg'}
                  price={`D${property.price.toLocaleString()}`}
                  bedrooms={property.bedrooms || 0}
                  bathrooms={property.bathrooms || 0}
                  addressLine1={property.address}
                  addressLine2={`${property.city}, Gambia`}
                  propertyType={property.property_type}
                  listingType={property.listing_type}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="colored"
                  onClick={() => {
                    setPage(prev => prev + 1);
                    performSearch(filters, page + 1);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Type */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Property Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {propertyTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handleFilterChange('property_type', type.value || undefined)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          filters.property_type === type.value
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <type.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Type */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Listing Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleFilterChange('listing_type', undefined)}
                      className={`px-4 py-3 rounded-lg border transition-colors ${
                        !filters.listing_type
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleFilterChange('listing_type', 'sale')}
                      className={`px-4 py-3 rounded-lg border transition-colors ${
                        filters.listing_type === 'sale'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      For Sale
                    </button>
                    <button
                      onClick={() => handleFilterChange('listing_type', 'rent')}
                      className={`px-4 py-3 rounded-lg border transition-colors ${
                        filters.listing_type === 'rent'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      For Rent
                    </button>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Minimum Bedrooms</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {bedroomOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleFilterChange('min_bedrooms', option.value)}
                        className={`px-4 py-3 rounded-lg border transition-colors ${
                          filters.min_bedrooms === option.value
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Location</h4>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter city or area..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={filters.city || ''}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                    />
                  </div>
                </div>

                {/* Square Feet */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Square Feet (min)</h4>
                  <div className="relative">
                    <Square className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Minimum square feet..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      onChange={(e) => console.log('Square feet filter coming soon')}
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={filters.has_pool || false}
                        onChange={(e) => handleFilterChange('has_pool', e.target.checked)}
                      />
                      <Droplets className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Pool</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={filters.has_garden || false}
                        onChange={(e) => handleFilterChange('has_garden', e.target.checked)}
                      />
                      <Trees className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Garden</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={filters.is_furnished || false}
                        onChange={(e) => handleFilterChange('is_furnished', e.target.checked)}
                      />
                      <Sofa className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Furnished</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={filters.featured_only || false}
                        onChange={(e) => handleFilterChange('featured_only', e.target.checked)}
                      />
                      <Car className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Featured Only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex gap-3">
              <Button
                variant="white"
                onClick={clearAllFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                variant="colored"
                onClick={applyFilters}
                className="flex-1"
              >
                Apply Filters ({getActiveFilterCount()})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
