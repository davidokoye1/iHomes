import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import FeaturedHomeProperties from "./FeaturedHomeProperties";
import Button from "./Button";
interface CtaCardProps {
  location: string;
  bedrooms: string | number;
  bathrooms: string | number;
  price: string | number;
}

const CtaCard = ({ location, bedrooms, bathrooms, price }: CtaCardProps) => {
  const [liked, setLiked] = useState(false);

  const toggleLike = () => setLiked((prev) => !prev);

  return (
    <div className="cta-block bg-[#BDF89E] w-[422px] h-[348px] rounded-[32px] p-[40px] flex flex-col items-start justify-between">
      <div className="flex flex-col w-full gap-[14px]">
        <div className="w-full flex items-center justify-between">
          <p className="text-[18px] leading-[21px]">{location}</p>
          <button
            onClick={toggleLike}
            className="hover:scale-110 transition-transform duration-150"
            aria-label="Toggle favorite"
          >
            <Heart
              size={24}
              className={liked ? "fill-red-500 text-red-500" : "text-black"}
            />
          </button>
        </div>
        <div className="flex items-center justify-start gap-[32px]">
          <FeaturedHomeProperties value={bedrooms} label="Beds" />
          <FeaturedHomeProperties value={bathrooms} label="Baths" />
          <FeaturedHomeProperties value="24/7" label="Water" />
        </div>
      </div>
      <div className="flex flex-col items-start justify-center w-full gap-[18px]">
        <h2>{price}</h2>
        <Button variant="black">Book A Consultation</Button>
      </div>
    </div>
  );
};

export default CtaCard;
