// FeaturedListings.tsx - Enhanced Responsive Component
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import ListingCard from "./ListingCard";
import { PropertiesService } from "../services/properties";
import type { PropertyListing } from "../types/database";
import "../styles/global.css";

const FeaturedListings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get featured properties directly with a higher limit
      const featuredProperties = await PropertiesService.getFeaturedProperties(20);
      
      if (featuredProperties.length === 0) {
        setError('No featured properties found. Try marking some properties as featured in the database.');
      } else {
        setProperties(featuredProperties);
        setRetryCount(0); // Reset retry count on success
      }
    } catch (err) {
      console.error('Error fetching featured properties:', err);
      setError('Failed to load featured properties. Check console for details.');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchFeaturedProperties();
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <section className="featured-listings-container w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="h-7 sm:h-8 bg-gray-200 animate-pulse rounded-lg w-48 sm:w-56"></div>
        <div className="h-9 sm:h-10 bg-gray-200 animate-pulse rounded-lg w-20 sm:w-24"></div>
      </div>
      
      {/* Desktop/Tablet Loading Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
        {[...Array(8)].map((_, index) => (
          <div 
            key={index} 
            className="bg-gray-200 animate-pulse rounded-2xl lg:rounded-3xl aspect-[4/5] shadow-sm" 
          />
        ))}
      </div>
      
      {/* Mobile Loading Scroll */}
      <div className="sm:hidden">
        <div className="flex gap-4 overflow-hidden pb-4 -mx-4 px-4">
          {[...Array(4)].map((_, index) => (
            <div 
              key={index} 
              className="bg-gray-200 animate-pulse rounded-2xl aspect-[4/5] w-64 flex-shrink-0 shadow-sm" 
            />
          ))}
        </div>
      </div>
    </section>
  );

  // Error state component
  const ErrorState = () => (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 text-red-500 mt-0.5">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-red-800 text-sm sm:text-base font-medium mb-2">
            Unable to load featured properties
          </p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button 
            onClick={handleRetry}
            variant="colored"
            className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {retryCount > 0 ? `Retry (${retryCount})` : 'Try Again'}
          </Button>
        </div>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12 sm:py-16 lg:py-20">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
          No Featured Properties
        </h3>
        <p className="text-gray-500 text-sm sm:text-base mb-6 leading-relaxed">
          We're currently updating our featured listings. Check back soon or browse all available properties.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            onClick={handleRetry}
            variant="colored"
            className="px-6 py-3 text-sm font-medium"
          >
            Refresh Listings
          </Button>
          <Link to="/search">
            <Button 
              variant="white"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium"
            >
              Browse All Properties
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <section className="featured-listings-container w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Featured Properties
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Handpicked properties just for you
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {properties.length > 0 && (
            <span className="hidden sm:inline-block text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </span>
          )}
          <Link to="/search?featured=true">
            <Button 
              variant="viewAll"
              className="border-gray-300 hover:border-gray-400 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 hover:shadow-md" 
            >
              <span className="hidden sm:inline">View all featured →</span>
              <span className="sm:hidden">View all</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorState />}

      {/* Empty state */}
      {properties.length === 0 && !error && <EmptyState />}

      {/* Properties Grid */}
      {properties.length > 0 && (
        <>
          {/* Desktop and Tablet Grid - Enhanced responsive breakpoints */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 xl:gap-8">
            {properties.slice(0, 10).map((property, index) => (
              <div 
                key={property.id}
                className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <ListingCard
                  id={property.id}
                  imageUrl={property.primary_image || '/placeholder-property.jpg'}
                  price={`${property.price.toLocaleString()}`}
                  bedrooms={property.bedrooms || 0}
                  bathrooms={property.bathrooms || 0}
                  addressLine1={property.address}
                  addressLine2={`${property.city}, GM`}
                  propertyType={property.property_type}
                  listingType={property.listing_type}
                  featured={true}
                />
              </div>
            ))}
          </div>

          {/* Mobile Horizontal Scroll - Enhanced */}
          <div className="sm:hidden">
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
              {properties.slice(0, 8).map((property, index) => (
                <div 
                  key={property.id} 
                  className="flex-shrink-0 w-72 snap-start transform transition-transform duration-300"
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    animation: 'slideInRight 0.8s ease-out forwards'
                  }}
                >
                  <ListingCard
                    id={property.id}
                    imageUrl={property.primary_image || '/placeholder-property.jpg'}
                    price={`${property.price.toLocaleString()}`}
                    bedrooms={property.bedrooms || 0}
                    bathrooms={property.bathrooms || 0}
                    addressLine1={property.address}
                    addressLine2={`${property.city}, GM`}
                    propertyType={property.property_type}
                    listingType={property.listing_type}
                    featured={true}
                  />
                </div>
              ))}
              
              {/* View More Card for Mobile */}
              {properties.length > 8 && (
                <div className="flex-shrink-0 w-72 snap-start">
                  <Link 
                    to="/search?featured=true"
                    className="flex items-center justify-center h-full min-h-[320px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors duration-300 group"
                  >
                    <div className="text-center p-6">
                      <div className="w-12 h-12 mx-auto mb-4 text-blue-500 group-hover:text-blue-600 transition-colors">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        View More
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        See all {properties.length} featured properties
                      </p>
                      <Button 
                        variant="colored"
                        className="text-sm px-4 py-2"
                      >
                        Browse All
                      </Button>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile scroll indicator */}
            {properties.length > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {properties.slice(0, Math.min(8, properties.length)).map((_, index) => (
                  <div 
                    key={index}
                    className="w-2 h-2 rounded-full bg-gray-300"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Show more button for desktop when there are many properties */}
          {properties.length > 10 && (
            <div className="hidden sm:flex justify-center mt-8 lg:mt-12">
              <Link to="/search?featured=true">
                <Button 
                  variant="white"
                  className="px-8 py-3 text-base font-medium hover:shadow-lg transition-all duration-300"
                >
                  View All {properties.length} Featured Properties
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* Add custom animations to global CSS */}
      <style >{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .scroll-smooth {
          scroll-behavior: smooth;
        }
      `}</style>
    </section>
  );
};

export default FeaturedListings;