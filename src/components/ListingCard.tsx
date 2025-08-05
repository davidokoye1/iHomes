import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Bed, Bath, Home, Star, Eye } from "lucide-react";
import type { PropertyType, ListingType} from "../types/database";
import PlaceHolder from "../assets/listing-01.jpg"

interface ListingCardProps {
  id: string;
  imageUrl: string;
  price: string | number;
  bedrooms?: number;
  bathrooms?: number;
  addressLine1: string;
  addressLine2: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  featured?: boolean;
  views?: number;
  isCompact?: boolean; // For list view mode
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  imageUrl,
  price,
  bedrooms = 0,
  bathrooms = 0,
  addressLine1,
  addressLine2,
  propertyType,
  listingType,
  featured,
  views,
  isCompact = false
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
    // Add haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleClick = () => {
    navigate(`/property/${id}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imageError) {
      setImageError(true);
      const target = e.target as HTMLImageElement;
      target.src = PlaceHolder;
    }
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const formatPrice = (price: number | string) => {
    let numericPrice;

    if (typeof price === 'string') {
      // Remove non-numeric characters except decimal point
      const cleaned = price.replace(/[^0-9.]/g, '');
      numericPrice = parseFloat(cleaned);
    } else {
      numericPrice = price;
    }

    // Handle invalid numbers
    if (isNaN(numericPrice)) {
      return "Price unavailable";
    }

    return `D${numericPrice.toLocaleString()}`;
  };

  const getPropertyTypeIcon = () => {
    switch (propertyType) {
      case 'house':
      case 'villa':
      case 'townhouse':
        return <Home className="h-3 w-3" />;
      default:
        return <Home className="h-3 w-3" />;
    }
  };

  // Compact/List view layout
  if (isCompact) {
    return (
      <div
        className="listing-card group w-full bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-200 active:scale-[0.98] sm:active:scale-100"
        onClick={handleClick}
      >
        <div className="flex p-3 sm:p-4 gap-3 sm:gap-4">
          {/* Image Container */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-gray-100">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
              src={imageUrl || PlaceHolder}
              alt="Property"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
            
            {/* Featured badge */}
            {featured && (
              <div className="absolute top-1 right-1 bg-yellow-400 text-black px-1.5 py-0.5 rounded text-xs font-semibold">
                <Star className="h-2.5 w-2.5 inline" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            {/* Price and Heart */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {formatPrice(price)}
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  listingType === "rent" 
                    ? "bg-white text-gray-800" 
                    : "bg-gray-900 text-white"
                }`}>
                  {listingType === "rent" ? "For Rent" : "For Sale"}
                </div>
              </div>
              <button
                onClick={toggleFavorite}
                className="p-2 -m-1 transition-transform hover:scale-110 active:scale-95"
                aria-label="Toggle favorite"
              >
                <Heart
                  size={18}
                  className={`stroke-2 ${
                    isFavorite ? "fill-red-500 stroke-red-500" : "stroke-gray-400"
                  }`}
                />
              </button>
            </div>

            {/* Property details */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {propertyType && (
                <div className="flex items-center gap-1">
                  {getPropertyTypeIcon()}
                  <span className="capitalize">{propertyType}</span>
                </div>
              )}
              {bedrooms > 0 && (
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  <span>{bedrooms}</span>
                </div>
              )}
              {bathrooms > 0 && (
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  <span>{bathrooms}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-gray-900 truncate">
                {addressLine1}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{addressLine2}</span>
              </div>
            </div>

            {/* Views */}
            {views && views > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Eye className="h-3 w-3" />
                <span>{views} views</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view layout (default)
  return (
    <div
      className="listing-card group w-full bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-200 hover:-translate-y-1 active:scale-[0.98] sm:active:scale-100"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={imageUrl || PlaceHolder}
          alt="Property"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges - top right */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2">
          {featured && (
            <div className="bg-yellow-400 text-black px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              <span className="sm:inline">Featured</span>
            </div>
          )}
          <div
            className={`px-2 py-1 rounded-md text-xs font-semibold shadow-sm backdrop-blur-sm ${
              listingType === "rent" 
                ? "bg-white/90 text-gray-800" 
                : "bg-gray-900/90 text-white"
            }`}
          >
            {listingType === "rent" ? "For Rent" : "For Sale"}
          </div>
        </div>

        {/* Favorite button - top left */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <button
            onClick={toggleFavorite}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95 shadow-sm"
            aria-label="Toggle favorite"
          >
            <Heart
              size={16}
              className={`stroke-2 ${
                isFavorite ? "fill-red-500 stroke-red-500" : "stroke-gray-600"
              }`}
            />
          </button>
        </div>

        {/* Views counter - bottom left */}
        {views && views > 0 && (
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{views}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Price */}
        <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
          {formatPrice(price)}
        </div>

        {/* Property type and details */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600">
          {propertyType && (
            <div className="flex items-center gap-1">
              {getPropertyTypeIcon()}
              <span className="capitalize">{propertyType}</span>
            </div>
          )}
          {bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          {bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1">
          <div className="text-sm sm:text-base font-medium text-gray-900 leading-tight line-clamp-1">
            {addressLine1}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{addressLine2}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;