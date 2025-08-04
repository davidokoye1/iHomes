// src/pages/SearchResults.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  DollarSign,
  Loader2,
  AlertCircle,
  Star,
  Filter,
  ChevronDown,
  SortAsc,
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

// Types for better type safety
interface FilterState extends SearchParams {
  amenity_ids: string[];
}

interface SearchState {
  properties: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  page: number;
}

interface UIState {
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  showSortMenu: boolean;
}

// Constants
const ITEMS_PER_PAGE = 12;
const DEFAULT_SORT = { sort_by: 'created_at', sort_order: 'DESC' } as const;

// Filter configuration
const PROPERTY_TYPES = [
  { value: '', label: 'All Types', icon: Home },
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'house', label: 'House', icon: Home },
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'townhouse', label: 'Townhouse', icon: Home },
  { value: 'villa', label: 'Villa', icon: Home },
  { value: 'land', label: 'Land', icon: Building2 },
  { value: 'commercial', label: 'Commercial', icon: Building2 }
] as const;

const PRICE_RANGES = [
  { label: 'Any Price', min: undefined, max: undefined },
  { label: 'Under D50,000', min: undefined, max: 50000 },
  { label: 'D50,000 - D100,000', min: 50000, max: 100000 },
  { label: 'D100,000 - D200,000', min: 100000, max: 200000 },
  { label: 'D200,000 - D500,000', min: 200000, max: 500000 },
  { label: 'D500,000 - D1,000,000', min: 500000, max: 1000000 },
  { label: 'Above D1,000,000', min: 1000000, max: undefined },
] as const;

const ROOM_OPTIONS = [
  { label: 'Any', value: undefined },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
] as const;

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at', order: 'DESC' },
  { label: 'Oldest First', value: 'created_at', order: 'ASC' },
  { label: 'Price: Low to High', value: 'price', order: 'ASC' },
  { label: 'Price: High to Low', value: 'price', order: 'DESC' },
  { label: 'Most Viewed', value: 'views_count', order: 'DESC' },
  { label: 'Featured First', value: 'featured', order: 'DESC' },
] as const;

/**
 * Enhanced SearchResults Component
 * Enterprise-grade property search with advanced filtering and clean architecture
 */
const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State management - grouped by concern
  const [searchState, setSearchState] = useState<SearchState>({
    properties: [],
    totalCount: 0,
    hasMore: false,
    loading: true,
    error: null,
    page: 1
  });

  const [uiState, setUIState] = useState<UIState>({
    viewMode: 'grid',
    showFilters: false,
    showSortMenu: false
  });

  const [filters, setFilters] = useState<FilterState>({ amenity_ids: [] });
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // Memoized values
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'amenity_ids') return Array.isArray(value) && value.length > 0;
      return value !== undefined && value !== null && value !== '' && value !== false;
    }).length;
  }, [filters]);

  const currentSortLabel = useMemo(() => {
    const option = SORT_OPTIONS.find(
      opt => opt.value === filters.sort_by && opt.order === filters.sort_order
    );
    return option?.label || 'Newest First';
  }, [filters.sort_by, filters.sort_order]);

  // Utility functions
  const buildUrlParams = useCallback((filterState: FilterState) => {
    const params = new URLSearchParams();
    
    Object.entries(filterState).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === false) return;
      
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v.toString()));
      } else {
        params.set(key, String(value));
      }
    });
    
    return params;
  }, []);

  const parseUrlFilters = useCallback((): FilterState => {
    return {
      search_text: searchParams.get('search_text') || undefined,
      property_type: searchParams.get('property_type') as PropertyListing['property_type'] || undefined,
      listing_type: searchParams.get('listing_type') as PropertyListing['listing_type'] || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      min_bedrooms: searchParams.get('min_bedrooms') ? Number(searchParams.get('min_bedrooms')) : undefined,
      max_bedrooms: searchParams.get('max_bedrooms') ? Number(searchParams.get('max_bedrooms')) : undefined,
      min_bathrooms: searchParams.get('min_bathrooms') ? Number(searchParams.get('min_bathrooms')) : undefined,
      max_bathrooms: searchParams.get('max_bathrooms') ? Number(searchParams.get('max_bathrooms')) : undefined,
      city: searchParams.get('city') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      amenity_ids: searchParams.getAll('amenity_ids'),
      featured_only: searchParams.get('featured') === 'true',
      sort_by: searchParams.get('sort_by') || DEFAULT_SORT.sort_by,
      sort_order: searchParams.get('sort_order') || DEFAULT_SORT.sort_order
    };
  }, [searchParams]);

  // API calls
  const loadAmenities = useCallback(async () => {
    try {
      const data = await PropertiesService.getAmenities();
      setAmenities(data);
    } catch (error) {
      console.error('Failed to load amenities:', error);
      toast.error('Failed to load search filters');
    }
  }, []);

  const performSearch = useCallback(async (
    searchFilters: FilterState, 
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      setSearchState(prev => ({ ...prev, loading: true, error: null }));

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const searchParams: SearchParams = {
        ...searchFilters,
        limit: ITEMS_PER_PAGE,
        offset
      };

      const result = await PropertiesService.searchProperties(searchParams);
      
      const processedProperties = result.properties.map(property => ({
        ...property,
        price: typeof property.price === 'string' ? parseFloat(property.price) : property.price,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        square_feet: property.square_feet || 0
      }));

      setSearchState(prev => ({
        ...prev,
        properties: append ? [...prev.properties, ...processedProperties] : processedProperties,
        totalCount: result.total_count,
        hasMore: result.has_more,
        page,
        loading: false
      }));

    } catch (error) {
      console.error('Search failed:', error);
      const errorMessage = 'Failed to load properties. Please try again.';
      
      setSearchState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      
      toast.error('Search failed', { description: errorMessage });
    }
  }, []);

  // Event handlers
  const handleFilterChange = useCallback(<K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAmenityToggle = useCallback((amenityId: string) => {
    setFilters(prev => {
      const currentIds = prev.amenity_ids || [];
      const newIds = currentIds.includes(amenityId)
        ? currentIds.filter(id => id !== amenityId)
        : [...currentIds, amenityId];
      
      return { ...prev, amenity_ids: newIds };
    });
  }, []);

  const handleQuickFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { 
      ...filters, 
      [key]: filters[key] === value ? undefined : value 
    };
    
    setFilters(newFilters);
    setSearchParams(buildUrlParams(newFilters));
    performSearch(newFilters, 1);
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  const applyFilters = useCallback(() => {
    const params = buildUrlParams(filters);
    setSearchParams(params);
    performSearch(filters, 1);
    setUIState(prev => ({ ...prev, showFilters: false }));
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = { 
      ...DEFAULT_SORT,
      amenity_ids: [] 
    };
    
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
    performSearch(clearedFilters, 1);
  }, [setSearchParams, performSearch]);

  const handleSort = useCallback((sortBy: string, sortOrder: string = 'DESC') => {
    const newFilters = { ...filters, sort_by: sortBy, sort_order: sortOrder };
    setFilters(newFilters);
    setSearchParams(buildUrlParams(newFilters));
    performSearch(newFilters, 1);
    setUIState(prev => ({ ...prev, showSortMenu: false }));
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  const handleLoadMore = useCallback(() => {
    const nextPage = searchState.page + 1;
    performSearch(filters, nextPage, true);
  }, [searchState.page, filters, performSearch]);

  const removeFilter = useCallback((key: keyof FilterState | 'price') => {
    const newFilters = { ...filters };
    if (key === 'price') {
      delete newFilters.min_price;
      delete newFilters.max_price;
    } else {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    setSearchParams(buildUrlParams(newFilters));
    performSearch(newFilters, 1);
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  // Effects
  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  useEffect(() => {
    const urlFilters = parseUrlFilters();
    setFilters(urlFilters);
    performSearch(urlFilters, 1);
  }, [searchParams, parseUrlFilters, performSearch]);

  // Render helpers
  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {filters.property_type && (
          <FilterTag
            label={PROPERTY_TYPES.find(t => t.value === filters.property_type)?.label || filters.property_type}
            onRemove={() => removeFilter('property_type')}
          />
        )}
        {filters.min_bedrooms && (
          <FilterTag
            label={`${filters.min_bedrooms}+ bedrooms`}
            onRemove={() => removeFilter('min_bedrooms')}
          />
        )}
        {(filters.min_price || filters.max_price) && (
          <FilterTag
            label={`Price: ${filters.min_price ? `D${filters.min_price.toLocaleString()}` : '0'} - ${filters.max_price ? `D${filters.max_price.toLocaleString()}` : '∞'}`}
            onRemove={() => removeFilter('price')}
          />
        )}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (searchState.loading && searchState.properties.length === 0) {
      return <LoadingState />;
    }

    if (searchState.properties.length === 0) {
      return <EmptyState onClearFilters={clearAllFilters} onGoHome={() => navigate('/')} />;
    }

    return (
      <>
        <div className={`grid ${
          uiState.viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        } gap-6 mb-8`}>
          {searchState.properties.map((property) => (
            <ListingCard
              key={property.id}
              id={property.id}
              imageUrl={property.primary_image || '/placeholder-property.jpg'}
              price={property.price}
              bedrooms={property.bedrooms || 0}
              bathrooms={property.bathrooms || 0}
              addressLine1={property.address}
              addressLine2={property.city}
              propertyType={property.property_type}
              listingType={property.listing_type}
              featured={property.featured}
            />
          ))}
        </div>

        {searchState.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="colored"
              onClick={handleLoadMore}
              disabled={searchState.loading}
              className="px-8 py-3"
            >
              {searchState.loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                `Load More (${Math.min(ITEMS_PER_PAGE, searchState.totalCount - searchState.properties.length)} remaining)`
              )}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <SearchHeader 
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onQuickFilter={handleQuickFilter}
          onShowFilters={() => setUIState(prev => ({ ...prev, showFilters: true }))}
          activeFilterCount={activeFilterCount}
          loading={searchState.loading}
        />

        {/* Error Display */}
        {searchState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{searchState.error}</p>
          </div>
        )}

        {/* Results Header */}
        <ResultsHeader
          totalCount={searchState.totalCount}
          city={filters.city}
          currentSort={currentSortLabel}
          viewMode={uiState.viewMode}
          showSortMenu={uiState.showSortMenu}
          onViewModeChange={(mode) => setUIState(prev => ({ ...prev, viewMode: mode }))}
          onSortMenuToggle={() => setUIState(prev => ({ ...prev, showSortMenu: !prev.showSortMenu }))}
          onSort={handleSort}
          sortOptions={SORT_OPTIONS}
          activeFilters={renderActiveFilters()}
        />

        {/* Click outside to close sort menu */}
        {uiState.showSortMenu && (
          <div
            className="fixed inset-0 z-5"
            onClick={() => setUIState(prev => ({ ...prev, showSortMenu: false }))}
          />
        )}

        {/* Search Results */}
        {renderSearchResults()}
      </div>

      {/* Filters Modal */}
      {uiState.showFilters && (
        <FiltersModal
          filters={filters}
          amenities={amenities}
          onFilterChange={handleFilterChange}
          onAmenityToggle={handleAmenityToggle}
          onApplyFilters={applyFilters}
          onClearFilters={clearAllFilters}
          onClose={() => setUIState(prev => ({ ...prev, showFilters: false }))}
          activeFilterCount={activeFilterCount}
          loading={searchState.loading}
          propertyTypes={PROPERTY_TYPES}
          priceRanges={PRICE_RANGES}
          roomOptions={ROOM_OPTIONS}
        />
      )}
    </div>
  );
};

// Sub-components for better organization
const FilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-md">
    {label}
    <button onClick={onRemove} className="hover:bg-green-200 rounded-sm p-0.5">
      <X className="h-3 w-3" />
    </button>
  </span>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-96">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-6"></div>
    <h3 className="text-xl font-medium text-gray-700">Finding properties...</h3>
    <p className="text-gray-500 mt-2">This may take a moment</p>
  </div>
);

const EmptyState = ({ onClearFilters, onGoHome }: { 
  onClearFilters: () => void; 
  onGoHome: () => void; 
}) => (
  <div className="text-center py-16 bg-white rounded-2xl">
    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-gray-100 rounded-full">
      <Search className="h-12 w-12 text-gray-400" />
    </div>
    <h3 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Try adjusting your search criteria or clearing some filters.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button variant="colored" onClick={onClearFilters} className="px-6">
        Clear All Filters
      </Button>
      <Button variant="white" onClick={onGoHome} className="px-6 border-gray-300">
        Back to Home
      </Button>
    </div>
  </div>
);

// Sub-components
const SearchHeader = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onQuickFilter, 
  onShowFilters,
  activeFilterCount,
  loading 
}: {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onApplyFilters: () => void;
  onQuickFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onShowFilters: () => void;
  activeFilterCount: number;
  loading: boolean;
}) => (
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
            onChange={(e) => onFilterChange('search_text', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onApplyFilters()}
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={onShowFilters}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors relative group"
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                {activeFilterCount}
              </span>
            )}
          </button>

          <Button
            variant="colored"
            onClick={onApplyFilters}
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
        <QuickFilterButton
          active={filters.listing_type === 'sale'}
          onClick={() => onQuickFilter('listing_type', 'sale')}
        >
          For Sale
        </QuickFilterButton>
        <QuickFilterButton
          active={filters.listing_type === 'rent'}
          onClick={() => onQuickFilter('listing_type', 'rent')}
        >
          For Rent
        </QuickFilterButton>
        <QuickFilterButton
          active={!!filters.featured_only}
          onClick={() => onQuickFilter('featured_only', true)}
        >
          <Star className="h-4 w-4 inline mr-1" />
          Featured
        </QuickFilterButton>
      </div>
    </div>
  </div>
);

const QuickFilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg border transition-colors ${
      active
        ? 'bg-green-100 border-green-300 text-green-700'
        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
    }`}
  >
    {children}
  </button>
);

const ResultsHeader = ({
  totalCount,
  city,
  currentSort,
  viewMode,
  showSortMenu,
  onViewModeChange,
  onSortMenuToggle,
  onSort,
  sortOptions,
  activeFilters
}: {
  totalCount: number;
  city?: string;
  currentSort: string;
  viewMode: 'grid' | 'list';
  showSortMenu: boolean;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortMenuToggle: () => void;
  onSort: (sortBy: string, sortOrder: string) => void;
  sortOptions: readonly { label: string; value: string; order: string; }[];
  activeFilters: React.ReactNode;
}) => (
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
      {city && (
        <p className="text-gray-600 mt-1 flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          in {city}
        </p>
      )}
      {activeFilters}
    </div>

    <div className="flex items-center gap-4">
      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={onSortMenuToggle}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <SortAsc className="h-4 w-4" />
          <span className="hidden sm:inline">{currentSort}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showSortMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {sortOptions.map((option) => (
              <button
                key={`${option.value}-${option.order}`}
                onClick={() => onSort(option.value, option.order)}
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
            onClick={() => onViewModeChange('grid')}
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
            onClick={() => onViewModeChange('list')}
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
);

const FiltersModal = ({
  filters,
  amenities,
  onFilterChange,
  onAmenityToggle,
  onApplyFilters,
  onClearFilters,
  onClose,
  activeFilterCount,
  loading,
  propertyTypes,
  priceRanges,
  roomOptions
}: {
  filters: FilterState;
  amenities: Amenity[];
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onAmenityToggle: (amenityId: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onClose: () => void;
  activeFilterCount: number;
  loading: boolean;
  propertyTypes: readonly { value: string; label: string; icon: any; }[];
  priceRanges: readonly { label: string; min?: number; max?: number; }[];
  roomOptions: readonly { label: string; value?: number; }[];
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b bg-gray-50">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Property Filters</h3>
          <p className="text-gray-600 mt-1">Narrow down your search to find the perfect property</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Type */}
          <FilterSection
            title="Property Type"
            icon={<Home className="h-5 w-5 text-green-600" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {propertyTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <FilterButton
                    key={type.value}
                    active={filters.property_type === type.value}
                    onClick={() => onFilterChange('property_type', type.value as PropertyListing['property_type'] || undefined)}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm">{type.label}</span>
                  </FilterButton>
                );
              })}
            </div>
          </FilterSection>

          {/* Listing Type */}
          <FilterSection
            title="Listing Type"
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
          >
            <div className="grid grid-cols-3 gap-3">
              <FilterButton
                active={!filters.listing_type}
                onClick={() => onFilterChange('listing_type', undefined)}
              >
                All
              </FilterButton>
              <FilterButton
                active={filters.listing_type === 'sale'}
                onClick={() => onFilterChange('listing_type', 'sale')}
              >
                For Sale
              </FilterButton>
              <FilterButton
                active={filters.listing_type === 'rent'}
                onClick={() => onFilterChange('listing_type', 'rent')}
              >
                For Rent
              </FilterButton>
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection
            title="Price Range"
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
          >
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
              value={priceRanges.findIndex(range =>
                range.min === filters.min_price && range.max === filters.max_price
              )}
              onChange={(e) => {
                const range = priceRanges[Number(e.target.value)];
                onFilterChange('min_price', range.min);
                onFilterChange('max_price', range.max);
              }}
            >
              {priceRanges.map((range, idx) => (
                <option key={idx} value={idx}>{range.label}</option>
              ))}
            </select>
          </FilterSection>

          {/* Bedrooms */}
          <FilterSection
            title="Bedrooms"
            icon={<Bed className="h-5 w-5 text-green-600" />}
          >
            <div className="grid grid-cols-3 gap-3">
              {roomOptions.map((option) => (
                <FilterButton
                  key={option.label}
                  active={filters.min_bedrooms === option.value}
                  onClick={() => onFilterChange('min_bedrooms', option.value)}
                >
                  {option.label}
                </FilterButton>
              ))}
            </div>
          </FilterSection>

          {/* Bathrooms */}
          <FilterSection
            title="Bathrooms"
            icon={<Bath className="h-5 w-5 text-green-600" />}
          >
            <div className="grid grid-cols-3 gap-3">
              {roomOptions.map((option) => (
                <FilterButton
                  key={option.label}
                  active={filters.min_bathrooms === option.value}
                  onClick={() => onFilterChange('min_bathrooms', option.value)}
                >
                  {option.label}
                </FilterButton>
              ))}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection
            title="Location"
            icon={<MapPin className="h-5 w-5 text-green-600" />}
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter city or area..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                value={filters.city || ''}
                onChange={(e) => onFilterChange('city', e.target.value)}
              />
            </div>
          </FilterSection>
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
                  onChange={() => onAmenityToggle(amenity.id)}
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
              onChange={(e) => onFilterChange('featured_only', e.target.checked)}
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
          onClick={onClearFilters}
          className="flex-1 py-3 text-base font-medium border-gray-300"
        >
          Clear All Filters
        </Button>
        <Button
          variant="colored"
          onClick={onApplyFilters}
          className="flex-1 py-3 text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying...
            </span>
          ) : (
            `Apply Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`
          )}
        </Button>
      </div>
    </div>
  </div>
);

const FilterSection = ({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
}) => (
  <div className="space-y-4">
    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {children}
  </div>
);

const FilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
      active
        ? 'border-green-600 bg-green-50 text-green-700 font-medium shadow-sm'
        : 'border-gray-200 hover:border-gray-400 text-gray-700'
    }`}
  >
    {children}
  </button>
);

export default SearchResults;