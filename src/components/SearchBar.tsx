// src/components/SearchBar.tsx - Enhanced with Database Integration
import { useState, useEffect } from "react";
import { MapPin, Home, DollarSign, Expand, SlidersHorizontal, Search } from "lucide-react";
import Button from "./Button";
import { useSearch } from "../hooks/useSearch";
import { PropertiesService } from "../services/properties";
import type { PropertyType } from "../types/database";

interface SearchBarProps {
  className?: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
  region: string;
  is_popular: boolean;
}

interface Amenity {
  id: string;
  name: string;
  icon_name: string;
  category: string;
  is_popular: boolean;
}

// Constants for price ranges and bedrooms (can be moved to database later)
const PRICE_RANGES = [
  { label: "Any Price", min: undefined, max: undefined },
  { label: "Under D50,000", min: undefined, max: 50000 },
  { label: "D50,000 - D100,000", min: 50000, max: 100000 },
  { label: "D100,000 - D200,000", min: 100000, max: 200000 },
  { label: "D200,000 - D500,000", min: 200000, max: 500000 },
  { label: "D500,000 - D1,000,000", min: 500000, max: 1000000 },
  { label: "Above D1,000,000", min: 1000000, max: undefined },
];

const BEDROOM_OPTIONS = [
  { label: "Any Bedrooms", min: undefined, max: undefined },
  { label: "Studio", min: 0, max: 0 },
  { label: "1 Bedroom", min: 1, max: 1 },
  { label: "2 Bedrooms", min: 2, max: 2 },
  { label: "3 Bedrooms", min: 3, max: 3 },
  { label: "4 Bedrooms", min: 4, max: 4 },
  { label: "5+ Bedrooms", min: 5, max: undefined },
];

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const SearchBar: React.FC<SearchBarProps> = ({ className = "" }) => {
  const { searchParams, updateSearchParam, performSearch } = useSearch();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  
  // Database-driven state
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Load locations and amenities from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const locationsData = await PropertiesService.getLocations();
        setLocations(locationsData);
      } catch (error) {
        console.error('Error loading search data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Display functions
  const getLocationDisplay = () => {
    if (searchParams.city) {
      const location = locations.find(loc => loc.name === searchParams.city);
      return location ? `${location.name}, GM` : `${searchParams.city}, GM`;
    }
    return "Any Location, GM";
  };

  const getPropertyTypeDisplay = () => {
    if (!searchParams.property_type) return "All Types";
    const type = PROPERTY_TYPES.find(t => t.value === searchParams.property_type);
    return type ? type.label : searchParams.property_type.charAt(0).toUpperCase() + searchParams.property_type.slice(1);
  };

  const getPriceRangeDisplay = () => {
    const range = PRICE_RANGES.find(
      (r) => r.min === searchParams.min_price && r.max === searchParams.max_price
    );
    return range ? range.label : "Any Price";
  };

  const getBedroomsDisplay = () => {
    if (!searchParams.min_bedrooms) return "Any Bedrooms";
    const option = BEDROOM_OPTIONS.find((o) => o.min === searchParams.min_bedrooms);
    return option ? option.label : `${searchParams.min_bedrooms}+ Bedrooms`;
  };

  // Filter locations based on search
  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      location.region.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Group locations by region
  const groupedLocations = filteredLocations.reduce((acc, location) => {
    if (!acc[location.region]) acc[location.region] = [];
    acc[location.region].push(location);
    return acc;
  }, {} as Record<string, Location[]>);

  // Sort regions to show popular locations first
  const sortedRegions = Object.keys(groupedLocations).sort((a, b) => {
    const aHasPopular = groupedLocations[a].some(loc => loc.is_popular);
    const bHasPopular = groupedLocations[b].some(loc => loc.is_popular);
    if (aHasPopular && !bHasPopular) return -1;
    if (!aHasPopular && bHasPopular) return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <div className={`search-bar flex items-center justify-center p-[20px] max-w-[1314px] max-h-[111px] mx-auto relative ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Dropdown components
  const LocationDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => toggleDropdown("location")}
        className="inline-flex items-center gap-[8px] rounded-full border border-gray-300 pl-[32px] pr-[48px] py-[11px] bg-white hover:shadow-lg hover:border-gray-400 transition-all duration-200 text-left min-w-[200px]"
      >
        <MapPin className="w-[32px] h-[32px] text-gray-600" strokeWidth={1.5} />
        <div className="text-[16px] text-gray-700 flex-1">
          <span className="block text-[14px] text-gray-500 font-medium">Location</span>
          <span className="font-semibold text-[16px] text-gray-900">{getLocationDisplay()}</span>
        </div>
      </button>

      {activeDropdown === "location" && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {/* Any Location Option */}
            <div className="border-b border-gray-100">
              <div className="py-1">
                <button
                  onClick={() => {
                    updateSearchParam("city", undefined);
                    setActiveDropdown(null);
                    setLocationSearch("");
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors duration-150 flex items-center justify-between group"
                >
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-green-700">Any Location</div>
                    <div className="text-sm text-gray-500">Search all areas</div>
                  </div>
                </button>
              </div>
            </div>

            {sortedRegions.map((region) => (
              <div key={region} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {region.replace("REGION", "").trim()}
                  </h4>
                </div>
                <div className="py-1">
                  {groupedLocations[region]
                    .sort((a, b) => {
                      if (a.is_popular && !b.is_popular) return -1;
                      if (!a.is_popular && b.is_popular) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((location) => (
                      <button
                        key={location.id}
                        onClick={() => {
                          updateSearchParam("city", location.name);
                          setActiveDropdown(null);
                          setLocationSearch("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors duration-150 flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 group-hover:text-green-700">
                              {location.name}
                            </span>
                            {location.is_popular && (
                              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 text-xs rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{location.type}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const PropertyTypeDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => toggleDropdown("propertyType")}
        className="inline-flex items-center gap-[8px] rounded-full border border-gray-300 pl-[32px] pr-[48px] py-[11px] bg-white hover:shadow-lg hover:border-gray-400 transition-all duration-200 text-left min-w-[180px]"
      >
        <Home className="w-[32px] h-[32px] text-gray-600" strokeWidth={1.5} />
        <div className="text-[16px] text-gray-700 flex-1">
          <span className="block text-[14px] text-gray-500 font-medium">Property Type</span>
          <span className="font-semibold text-[16px] text-gray-900">{getPropertyTypeDisplay()}</span>
        </div>
      </button>

      {activeDropdown === "propertyType" && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="py-2">
            {PROPERTY_TYPES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  updateSearchParam("property_type", (option.value as PropertyType) || undefined);
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-3 hover:bg-green-50 text-gray-700 transition-colors duration-150 flex items-center gap-3 group"
              >
                <span className="font-medium group-hover:text-green-700">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const PriceDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => toggleDropdown("price")}
        className="inline-flex items-center gap-[8px] rounded-full border border-gray-300 pl-[32px] pr-[48px] py-[11px] bg-white hover:shadow-lg hover:border-gray-400 transition-all duration-200 text-left min-w-[200px]"
      >
        <DollarSign className="w-[32px] h-[32px] text-gray-600" strokeWidth={1.5} />
        <div className="text-[16px] text-gray-700 flex-1">
          <span className="block text-[14px] text-gray-500 font-medium">Price Range</span>
          <span className="font-semibold text-[16px] text-gray-900">{getPriceRangeDisplay()}</span>
        </div>
      </button>

      {activeDropdown === "price" && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="py-2">
            {PRICE_RANGES.map((range, index) => (
              <button
                key={index}
                onClick={() => {
                  updateSearchParam("min_price", range.min);
                  updateSearchParam("max_price", range.max);
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-3 hover:bg-green-50 text-gray-700 transition-colors duration-150 group"
              >
                <div className="font-semibold text-gray-900 group-hover:text-green-700">{range.label}</div>
                {range.min || range.max ? (
                  <div className="text-sm text-gray-500 mt-1">
                    {range.min && range.max
                      ? `D${range.min.toLocaleString()} - D${range.max.toLocaleString()}`
                      : range.min
                      ? `From D${range.min.toLocaleString()}`
                      : `Up to D${range.max?.toLocaleString()}`
                    }
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const BedroomsDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => toggleDropdown("bedrooms")}
        className="inline-flex items-center gap-[8px] rounded-full border border-gray-300 pl-[32px] pr-[48px] py-[11px] bg-white hover:shadow-lg hover:border-gray-400 transition-all duration-200 text-left min-w-[160px]"
      >
        <Expand className="w-[32px] h-[32px] text-gray-600" strokeWidth={1.5} />
        <div className="text-[16px] text-gray-700 flex-1">
          <span className="block text-[14px] text-gray-500 font-medium">Bedrooms</span>
          <span className="font-semibold text-[16px] text-gray-900">{getBedroomsDisplay()}</span>
        </div>
      </button>

      {activeDropdown === "bedrooms" && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="py-2">
            {BEDROOM_OPTIONS.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  updateSearchParam("min_bedrooms", option.min);
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-3 hover:bg-green-50 text-gray-700 transition-colors duration-150 group"
              >
                <div className="font-semibold text-gray-900 group-hover:text-green-700">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`search-bar flex items-center justify-between p-[20px] max-w-[1314px] max-h-[111px] mx-auto relative ${className}`}>
      <div className="search-bar-items flex items-center justify-between w-full">
        <div className="search-bar-input-fields gap-[16px] flex items-center">
          <LocationDropdown />
          <PropertyTypeDropdown />
          <PriceDropdown />
          <BedroomsDropdown />
        </div>
        <div className="h-[72px] w-[2px] bg-gray-200 mx-2" />
        <div className="search-bar-buttons flex items-center gap-2">
          <button
            className="w-[72px] h-[72px] rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
            aria-label="Advanced Search"
            onClick={performSearch}
          >
            <SlidersHorizontal className="w-[24px] text-gray-600" />
          </button>
          <Button variant="colored" className="search-button" onClick={performSearch}>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;