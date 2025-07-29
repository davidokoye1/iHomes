import { useState } from "react";
import { Heart } from "lucide-react";

interface ListingCardProps {
  imageUrl: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  addressLine1: string;
  addressLine2: string;
}

const ListingCard: React.FC<ListingCardProps> = ({
  imageUrl,
  price,
  bedrooms,
  bathrooms,
  addressLine1,
  addressLine2,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => setIsFavorite((prev) => !prev);

  return (
    <div className="listing-card w-full max-w-[400px] p-4 flex flex-col gap-4 rounded-xl ">
      <img
        src={imageUrl}
        alt="Property"
        className="w-full h-[321px] object-cover rounded-lg"
      />

      <div className="flex flex-col">
        {/* Price and Favorite */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">{price}</h3>
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
