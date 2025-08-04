import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
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
  featured
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  const handleClick = () => {
    navigate(`/property/${id}`);
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
      return "GMD Price unavailable";
    }

    return `GMD ${numericPrice.toLocaleString()}${listingType === "rent" ? "/m" : ""}`;
  };

  return (
    <div
      className="listing-card w-[310px] p-4 flex flex-col gap-4 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >

      <div className="relative ">
        <img
            src={imageUrl ? imageUrl : PlaceHolder}
            alt="Property"
            className="w-full h-[321px] object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target) {
                target.src = PlaceHolder;
              }
            }}
        />
        <div className="absolute flex top-2 right-2 gap-1">
          {featured && (
              <div className="bg-yellow-400 text-black px-2 py-1 rounded text-sm font-semibold">
                Featured
              </div>
          )}
          <div
              className={`px-2 py-1 rounded-full text-sm font-semibold ${
                  listingType === "rent" ? "bg-white text-black" : "bg-black text-white"
              }`}
          >
            {listingType === "rent" ? "For Rent" : "For Sale"}
          </div>
        </div>

      </div>

      <div className="flex flex-col">
        {/* Price and Favorite */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">{formatPrice(price)}</h3>
          <button
            onClick={toggleFavorite}
            className="transition-transform hover:scale-110"
            aria-label="Toggle favorite"
          >
            <Heart
              size={24}
              className={`stroke-2 ${
                isFavorite ? "fill-red-500 stroke-red-500" : "stroke-gray-400"
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Property Type & Listing Type */}
          <div className="flex gap-2 text-gray-500 text-sm">
            {propertyType && <span className="capitalize">{propertyType}</span>}
            {listingType && <span>• {listingType === 'sale' ? 'For Sale' : 'For Rent'}</span>}
          </div>
          
          {/* Meta Info */}
          <div className="flex gap-4 text-gray-500 text-lg">
            <span>{bedrooms} Beds</span>
            <span>{bathrooms} Bath</span>
          </div>

          {/* Address */}
          <div className="text-gray-600 text-base leading-tight">
            <p>{addressLine1}</p>
            <p>{addressLine2}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;