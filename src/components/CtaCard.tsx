// CtaCard.tsx - Improved Responsive Version
import { useState } from "react";
import { Heart } from "lucide-react";
import FeaturedHomeProperties from "./FeaturedHomeProperties";
import Button from "./Button";

interface CtaCardProps {
  location: string;
  bedrooms: string | number;
  bathrooms: string | number;
  price: string | number;
  listingType: string | number;
  className?: string;
}

const CtaCard = ({ 
  location, 
  bedrooms, 
  bathrooms, 
  price, 
  listingType,
  className = ""
}: CtaCardProps) => {
  const [liked, setLiked] = useState(false);

  const formatPrice = (price: number | string) => {
    let numericPrice: number;
    
    if (typeof price === 'string') {
      numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    } else {
      numericPrice = price;
    }
    
    return `GMD ${numericPrice.toLocaleString()}${listingType === "rent" ? "/month" : ""}`;
  };

  const toggleLike = () => setLiked(prev => !prev);

  return (
    <div className={`bg-[#BDF89E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-full min-h-[280px] ${className}`}>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between">
          <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 flex-1 pr-2">
            {location}
          </p>
          <button
            onClick={toggleLike}
            className="hover:scale-110 transition-transform duration-150 p-1"
            aria-label="Toggle favorite"
          >
            <Heart
              size={20}
              className={`sm:w-6 sm:h-6 ${liked ? "fill-red-500 text-red-500" : "text-gray-700"}`}
            />
          </button>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <FeaturedHomeProperties value={bedrooms} label="Beds" />
          <FeaturedHomeProperties value={bathrooms} label="Baths" />
          <FeaturedHomeProperties value="24/7" label="Water" />
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-4 mt-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          {formatPrice(price)}
        </h2>
        <Button variant="black" className="w-full">
          Book A Consultation
        </Button>
      </div>
    </div>
  );
};

export default CtaCard;
