// src/components/RecommendedListings.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import ListingCard from "./ListingCard";
import { PropertiesService } from "../services/properties";
import type { PropertyListing } from "../types/database";
import "../styles/global.css";

const RecommendedListings = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentProperties();
  }, []);

  const fetchRecentProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentProperties = await PropertiesService.getRecentProperties(8);
      
      if (recentProperties.length === 0) {
        setError('No properties found. Try creating some sample properties.');
      } else {
        setProperties(recentProperties);
      }
    } catch (err) {
      console.error('Error fetching recent properties:', err);
      setError('Failed to load properties. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="recommended-listings-container w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-2xl font-semibold">Recent Properties</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="w-[400px] bg-gray-200 animate-pulse rounded-xl h-[400px] flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="recommended-listings-container w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-2xl font-semibold">Recent Properties</h2>
        <Link to="/search">
          <Button className="border-gray-300" variant="viewAll">
            View all &gt;
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchRecentProperties}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      )}

      {properties.length === 0 && !error ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No properties available at the moment</p>
          <button 
            onClick={fetchRecentProperties}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="flex overflow-x-auto hide-scrollbar gap-4">
          {properties.map((property) => (
            <div key={property.id} className="flex-shrink-0">
              <ListingCard
                id={property.id}
                imageUrl={property.primary_image || '/placeholder-property.jpg'}
                price={`${property.price.toLocaleString()}${property.listing_type === 'rent' ? '/month' : ''}`}
                bedrooms={property.bedrooms || 0}
                bathrooms={property.bathrooms || 0}
                addressLine1={property.address}
                addressLine2={`${property.city}, GM`}
                propertyType={property.property_type}
                listingType={property.listing_type}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendedListings;