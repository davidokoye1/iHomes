import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Grid, List, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
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
  
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const limit = 12;

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

  const handleFilterChange = (newFilters: SearchParams) => {
    setFilters(newFilters);
    setPage(1);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
    
    performSearch(newFilters, 1);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchParams({});
    performSearch({}, 1);
  };

  const clearFilter = (filterKey: keyof SearchParams) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    handleFilterChange(newFilters);
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.property_type) active.push({ key: 'property_type', label: `Type: ${filters.property_type.charAt(0).toUpperCase() + filters.property_type.slice(1)}`, value: filters.property_type });
    if (filters.listing_type) active.push({ key: 'listing_type', label: `For ${filters.listing_type.charAt(0).toUpperCase() + filters.listing_type.slice(1)}`, value: filters.listing_type });
    if (filters.city) active.push({ key: 'city', label: `Location: ${filters.city}`, value: filters.city });
    return active;
  };

  const MoreFiltersModal = () => (
    showMoreFilters && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">More Filters</h3>
            <button
              onClick={() => setShowMoreFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Text
              </label>
              <input
                type="text"
                placeholder="Search properties..."
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.search_text || ''}
                onChange={(e) => handleFilterChange({ ...filters, search_text: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.property_type || ''}
                onChange={(e) => handleFilterChange({ ...filters, property_type: e.target.value as any || undefined })}
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Type
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.listing_type || ''}
                onChange={(e) => handleFilterChange({ ...filters, listing_type: e.target.value as any || undefined })}
              >
                <option value="">All</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="Enter city..."
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange({ ...filters, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (GMD)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange({ ...filters, min_price: e.target.value ? Number(e.target.value) : undefined })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange({ ...filters, max_price: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms (Min)
              </label>
              <input
                type="number"
                placeholder="Min bedrooms"
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filters.min_bedrooms || ''}
                onChange={(e) => handleFilterChange({ ...filters, min_bedrooms: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                  checked={filters.featured_only || false}
                  onChange={(e) => handleFilterChange({ ...filters, featured_only: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700">Featured properties only</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowMoreFilters(false)}
              variant="colored"
              className="flex-1"
            >
              Apply Filters
            </Button>
            <Button
              onClick={() => {
                clearAllFilters();
                setShowMoreFilters(false);
              }}
              variant="white"
              className="flex-1"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-full p-2 mb-6 shadow-sm border flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full pl-12 pr-4 py-3 border-none rounded-full focus:outline-none focus:ring-0"
              value={filters.search_text || ''}
              onChange={(e) => handleFilterChange({ ...filters, search_text: e.target.value })}
            />
          </div>
          <button
            onClick={() => setShowMoreFilters(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>
          <Button
            variant="colored"
            className="px-8 py-3"
            onClick={() => performSearch(filters, 1)}
          >
            Search
          </Button>
        </div>

        {getActiveFilters().length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-gray-600">Active filters:</span>
            {getActiveFilters().map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {filter.label}
                <button
                  onClick={() => clearFilter(filter.key as keyof SearchParams)}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              {totalCount} Properties Found
            </h1>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex items-center bg-white rounded-full border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-full ${viewMode === 'grid' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-full ${viewMode === 'list' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {loading && properties.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your search criteria or clearing some filters.</p>
            <Button
              variant="colored"
              onClick={() => {
                setFilters({});
                setSearchParams({});
                performSearch({}, 1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
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
        )}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              variant="colored"
              onClick={() => {
                setPage((prev) => prev + 1);
                performSearch(filters, page + 1);
              }}
            >
              Load More
            </Button>
          </div>
        )}
        <MoreFiltersModal />
      </div>
    </div>
  );
}
export default SearchResults;
