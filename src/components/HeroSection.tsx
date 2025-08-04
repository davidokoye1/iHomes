// 1. HeroSection.tsx - Updated
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/global.css";
import FeaturedPropertyCard from "./FeaturedPropertyCard";
import CtaCard from "./CtaCard";
import SearchBar from "./SearchBar";
import HeroImage from "../assets/hero-image.jpg";
import { PropertiesService } from "../services/properties";
import type { PropertyListing } from "../types/database";

const HeroSection = () => {
  const navigate = useNavigate();
  const [featuredProperty, setFeaturedProperty] =
    useState<PropertyListing | null>(null);

  useEffect(() => {
    const loadFeaturedProperty = async () => {
      try {
        const properties = await PropertiesService.getFeaturedProperties(1);
        if (properties.length > 0) {
          setFeaturedProperty(properties[0]);
        }
      } catch (error) {
        console.error("Error loading featured property:", error);
      }
    };

    loadFeaturedProperty();
  }, []);

  const handleViewDetails = () => {
    if (featuredProperty) {
      navigate(`/property/${featuredProperty.id}`);
    } else {
      navigate("/search?city=Tabokoto");
    }
  };

  const getDisplayLocation = () => {
    if (featuredProperty) {
      return `${featuredProperty.city}, GM`; // Removed country field reference
    }
    return "Tabokoto, GM";
  };

  const getDisplayImage = () => {
    if (featuredProperty && featuredProperty.primary_image) {
      return featuredProperty.primary_image;
    }
    return HeroImage;
  };

  const getBedroomsDisplay = () => {
    return featuredProperty ? featuredProperty.bedrooms : 0;
  };
  const getBathroomsDisplay = () => {
    return featuredProperty ? featuredProperty.bathrooms : 0;
  };
  const getPriceDisplay = () => {
    return featuredProperty ? `GMD ${featuredProperty.price}` : `GMD ${2000}`;
  };
  return (
    <section className="hero-section mt-[36px] flex flex-col items-start justify-center gap-[22px]">
      <h1 className="heading1">Let Us Find The Perfect Place For You</h1>

      <div className="bento1 flex flex-col items-center justify-center gap-[32px]">
        {featuredProperty ? (
          <div className="bento2 flex items-center justify-center gap-[32px]">
            <FeaturedPropertyCard
              imageUrl={getDisplayImage()}
              location={getDisplayLocation()}
              onViewDetails={handleViewDetails}
            />
            <CtaCard
              location={getDisplayLocation()}
              bedrooms={getBedroomsDisplay()}
              bathrooms={getBathroomsDisplay()}
              price={getPriceDisplay()}
              listingType={featuredProperty.listing_type}
            />
          </div>
        ) : (
          ""
        )}
        <SearchBar />
      </div>
    </section>
  );
};

export default HeroSection;
