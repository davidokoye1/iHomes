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
  Building2,
  ChevronLeft,
  // Settings,
  // Menu
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
  showMobileSearch: boolean;
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
 * Mobile-first responsive design with improved UX
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
    showSortMenu: false,
    showMobileSearch: false
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
    setUIState(prev => ({ ...prev, showFilters: false, showMobileSearch: false }));
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

  // Close mobile overlays when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUIState(prev => ({ ...prev, showSortMenu: false }));
    };

    if (uiState.showSortMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [uiState.showSortMenu]);

  // Render helpers
  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3 px-4 sm:px-0">
        {filters.property_type && (
          <FilterTag
            label={PROPERTY_TYPES.find(t => t.value === filters.property_type)?.label || filters.property_type}
            onRemove={() => removeFilter('property_type')}
          />
        )}
        {filters.listing_type && (
          <FilterTag
            label={filters.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
            onRemove={() => removeFilter('listing_type')}
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
        {filters.city && (
          <FilterTag
            label={filters.city}
            onRemove={() => removeFilter('city')}
          />
        )}
        {filters.featured_only && (
          <FilterTag
            label="Featured"
            onRemove={() => removeFilter('featured_only')}
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
      <div className="px-4 sm:px-0">
        <div className={`grid ${
          uiState.viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        } gap-4 sm:gap-6 mb-8`}>
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
              className="px-6 sm:px-8 py-3 w-full sm:w-auto"
            >
              {searchState.loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                `Load More (${Math.min(ITEMS_PER_PAGE, searchState.totalCount - searchState.properties.length)} remaining)`
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto pb-6">
        {/* Mobile Search Header */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setUIState(prev => ({ ...prev, showMobileSearch: true }))}
                className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-left text-gray-500"
              >
                <Search className="h-5 w-5" />
                <span className="truncate">
                  {filters.search_text || 'Search properties...'}
                </span>
              </button>
              <button
                onClick={() => setUIState(prev => ({ ...prev, showFilters: true }))}
                className="ml-3 p-3 bg-[#7fd783] text-white rounded-xl relative"
              >
                <Filter className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Mobile Quick Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <MobileFilterButton
                active={filters.listing_type === 'sale'}
                onClick={() => handleQuickFilter('listing_type', 'sale')}
              >
                For Sale
              </MobileFilterButton>
              <MobileFilterButton
                active={filters.listing_type === 'rent'}
                onClick={() => handleQuickFilter('listing_type', 'rent')}
              >
                For Rent
              </MobileFilterButton>
              <MobileFilterButton
                active={!!filters.featured_only}
                onClick={() => handleQuickFilter('featured_only', true)}
              >
                <Star className="h-4 w-4 mr-1" />
                Featured
              </MobileFilterButton>
            </div>
          </div>
        </div>

        {/* Desktop Search Header */}
        <div className="hidden lg:block px-4 pt-6">
          <SearchHeader 
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onQuickFilter={handleQuickFilter}
            onShowFilters={() => setUIState(prev => ({ ...prev, showFilters: true }))}
            activeFilterCount={activeFilterCount}
            loading={searchState.loading}
          />
        </div>

        {/* Error Display */}
        {searchState.error && (
          <div className="mx-4 sm:mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{searchState.error}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="mt-4 lg:mt-6">
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
        </div>

        {/* Search Results */}
        <div className="mt-4 lg:mt-6">
          {renderSearchResults()}
        </div>
      </div>

      {/* Mobile Search Modal */}
      {uiState.showMobileSearch && (
        <MobileSearchModal
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onClose={() => setUIState(prev => ({ ...prev, showMobileSearch: false }))}
          onQuickFilter={handleQuickFilter}
          loading={searchState.loading}
        />
      )}

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

// Mobile Filter Button Component
const MobileFilterButton = ({ 
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
    className={`flex items-center justify-center gap-1 px-4 py-2 rounded-full border transition-colors whitespace-nowrap text-sm font-medium ${
      active
        ? 'bg-[#7fd783] border-[#7fd783] text-white'
        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
    }`}
  >
    {children}
  </button>
);

// Sub-components for better organization
const FilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-[#7fd783] text-sm rounded-full border border-green-200">
    <span className="truncate max-w-[120px] sm:max-w-none">{label}</span>
    <button 
      onClick={onRemove} 
      className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64 sm:h-96 px-4">
    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-[#7fd783] mb-4 sm:mb-6"></div>
    <h3 className="text-lg sm:text-xl font-medium text-gray-700 text-center">Finding properties...</h3>
    <p className="text-gray-500 mt-2 text-center text-sm sm:text-base">This may take a moment</p>
  </div>
);

const EmptyState = ({ onClearFilters, onGoHome }: { 
  onClearFilters: () => void; 
  onGoHome: () => void; 
}) => (
  <div className="text-center py-12 sm:py-16 bg-white rounded-2xl mx-4 sm:mx-0">
    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center bg-gray-100 rounded-full">
      <Search className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
    </div>
    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
    <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
      Try adjusting your search criteria or clearing some filters.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
      <Button variant="colored" onClick={onClearFilters} className="px-6 py-3">
        Clear All Filters
      </Button>
      <Button variant="white" onClick={onGoHome} className="px-6 py-3 border-gray-300">
        Back to Home
      </Button>
    </div>
  </div>
);

// Mobile Search Modal
const MobileSearchModal = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClose,
  onQuickFilter,
  loading
}: {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onApplyFilters: () => void;
  onClose: () => void;
  onQuickFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 bg-white z-50 lg:hidden">
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Search Properties</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties, locations, or features..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-transparent text-gray-900 placeholder-gray-500 text-lg"
            value={filters.search_text || ''}
            onChange={(e) => onFilterChange('search_text', e.target.value)}
            autoFocus
          />
        </div>

        {/* Quick Filters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Quick Filters</h3>
          <div className="grid grid-cols-2 gap-3">
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
              className="col-span-2"
            >
              <Star className="h-4 w-4 inline mr-2" />
              Featured Properties
            </QuickFilterButton>
          </div>
        </div>

        {/* Location Input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter city or area..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-[#7fd783] text-gray-900 placeholder-gray-500"
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
        <Button
          variant="colored"
          onClick={onApplyFilters}
          className="w-full py-4 text-lg font-medium"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Searching...
            </span>
          ) : 'Search Properties'}
        </Button>
        <button
          onClick={onClose}
          className="w-full py-3 text-gray-600 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Enhanced Search Header for Desktop
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
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
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
              <span className="absolute -top-2 -right-2 bg-[#7fd783] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center group-hover:scale-110 transition-transform">
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
  children,
  className = ""
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg border transition-colors ${
      active
        ? 'bg-green-100 border-green-300 text-[#7fd783]'
        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
    } ${className}`}
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
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
    <div className="flex flex-col space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
            {totalCount > 0 ? (
              <>
                {totalCount.toLocaleString()} {totalCount === 1 ? 'Property' : 'Properties'} Found
              </>
            ) : (
              'No Properties Found'
            )}
          </h1>
          {city && (
            <p className="text-gray-600 mt-1 flex items-center gap-1 text-sm sm:text-base">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">in {city}</span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={onSortMenuToggle}
              className="flex items-center justify-between w-full sm:w-auto gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{currentSort}</span>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {sortOptions.map((option) => (
                  <button
                    key={`${option.value}-${option.order}`}
                    onClick={() => onSort(option.value, option.order)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors text-sm sm:text-base"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#7fd783] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-[#7fd783] shadow-sm'
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

      {/* Active Filters */}
      {activeFilters}
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
    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gray-50">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Property Filters</h3>
          <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
            Narrow down your search to find the perfect property
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-4"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Property Type */}
          <FilterSection
            title="Property Type"
            icon={<Home className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {propertyTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <FilterButton
                    key={type.value}
                    active={filters.property_type === type.value}
                    onClick={() => onFilterChange('property_type', type.value as PropertyListing['property_type'] || undefined)}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs sm:text-sm truncate">{type.label}</span>
                  </FilterButton>
                );
              })}
            </div>
          </FilterSection>

          {/* Listing Type */}
          <FilterSection
            title="Listing Type"
            icon={<DollarSign className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <FilterButton
                active={!filters.listing_type}
                onClick={() => onFilterChange('listing_type', undefined)}
              >
                <span className="text-xs sm:text-sm">All</span>
              </FilterButton>
              <FilterButton
                active={filters.listing_type === 'sale'}
                onClick={() => onFilterChange('listing_type', 'sale')}
              >
                <span className="text-xs sm:text-sm">For Sale</span>
              </FilterButton>
              <FilterButton
                active={filters.listing_type === 'rent'}
                onClick={() => onFilterChange('listing_type', 'rent')}
              >
                <span className="text-xs sm:text-sm">For Rent</span>
              </FilterButton>
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection
            title="Price Range"
            icon={<DollarSign className="h-5 w-5 text-[#7fd783]" />}
          >
            <select
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-[#7fd783] transition-all duration-200 text-gray-900 text-sm sm:text-base"
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
            icon={<Bed className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {roomOptions.map((option) => (
                <FilterButton
                  key={option.label}
                  active={filters.min_bedrooms === option.value}
                  onClick={() => onFilterChange('min_bedrooms', option.value)}
                >
                  <span className="text-xs sm:text-sm">{option.label}</span>
                </FilterButton>
              ))}
            </div>
          </FilterSection>

          {/* Bathrooms */}
          <FilterSection
            title="Bathrooms"
            icon={<Bath className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {roomOptions.map((option) => (
                <FilterButton
                  key={option.label}
                  active={filters.min_bathrooms === option.value}
                  onClick={() => onFilterChange('min_bathrooms', option.value)}
                >
                  <span className="text-xs sm:text-sm">{option.label}</span>
                </FilterButton>
              ))}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection
            title="Location"
            icon={<MapPin className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter city or area..."
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-[#7fd783] transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                value={filters.city || ''}
                onChange={(e) => onFilterChange('city', e.target.value)}
              />
            </div>
          </FilterSection>
        </div>

        {/* Amenities Section - Full Width */}
        <div className="mt-6 sm:mt-8 space-y-4">
          <h4 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-[#7fd783]" />
            Amenities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {amenities.map((amenity) => (
              <label
                key={amenity.id}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-gray-300"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#7fd783] border-gray-300 rounded focus:ring-[#7fd783] focus:ring-2"
                  checked={filters.amenity_ids?.includes(amenity.id) || false}
                  onChange={() => onAmenityToggle(amenity.id)}
                />
                <span className="text-xs sm:text-sm text-gray-700 flex-1">{amenity.name}</span>
              </label>
            ))}
          </div>
          {amenities.length === 0 && (
            <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No amenities available</p>
          )}
        </div>

        {/* Featured Properties Toggle */}
        <div className="mt-6 sm:mt-8">
          <label className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl cursor-pointer hover:from-green-100 hover:to-blue-100 transition-colors border border-green-200">
            <input
              type="checkbox"
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#7fd783] border-gray-300 rounded focus:ring-[#7fd783] focus:ring-2"
              checked={filters.featured_only || false}
              onChange={(e) => onFilterChange('featured_only', e.target.checked)}
            />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-[#7fd783] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h5 className="font-semibold text-gray-900 text-sm sm:text-base">Featured Properties Only</h5>
                <p className="text-xs sm:text-sm text-gray-600">Show only our premium featured properties</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
        <Button
          variant="white"
          onClick={onClearFilters}
          className="flex-1 py-3 text-sm sm:text-base font-medium border-gray-300"
        >
          Clear All Filters
        </Button>
        <Button
          variant="colored"
          onClick={onApplyFilters}
          className="flex-1 py-3 text-sm sm:text-base font-medium"
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
  <div className="space-y-3 sm:space-y-4">
    <h4 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
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
    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-200 min-h-[40px] sm:min-h-[48px] ${
      active
        ? 'border-[#7fd783] bg-green-50 text-[#7fd783] font-medium shadow-sm'
        : 'border-gray-200 hover:border-gray-400 text-gray-700'
    }`}
  >
    {children}
  </button>
);

export default SearchResults;