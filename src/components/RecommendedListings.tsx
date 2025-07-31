// 2. RecommendedListings.tsx - Updated
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

  useEffect(() => {
    fetchRecentProperties();
  }, []);

  const fetchRecentProperties = async () => {
    try {
      const recentProperties = await PropertiesService.getRecentProperties(8);
      setProperties(recentProperties);
    } catch (error) {
      console.error('Error fetching recent properties:', error);
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

      {properties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No properties available at the moment</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto hide-scrollbar gap-4">
          {properties.map((property) => (
            <div key={property.id} className="flex-shrink-0">
              <ListingCard
                id={property.id}
                imageUrl={property.primary_image || '/placeholder-property.jpg'}
                price={`D${property.price.toLocaleString()}${property.listing_type === 'rent' ? '/month' : ''}`}
                bedrooms={property.bedrooms || 0}
                bathrooms={property.bathrooms || 0}
                addressLine1={property.address}
                addressLine2={`${property.city}, GM`} // Removed country field
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