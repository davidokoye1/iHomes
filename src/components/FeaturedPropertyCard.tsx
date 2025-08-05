import Button from "./Button";

interface FeaturedPropertyCardProps {
  imageUrl: string;
  location: string;
  onViewDetails?: () => void;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

const FeaturedPropertyCard = ({
  imageUrl,
  location,
  onViewDetails,
  showBadge = true,
  badgeText = "Featured",
  className = ""
}: FeaturedPropertyCardProps) => {
  return (
    <div
      className={`featured-property w-full max-w-[860px] h-[280px] sm:h-[320px] lg:h-[348px] rounded-[24px] sm:rounded-[32px] bg-cover bg-center flex flex-col justify-between items-start p-[24px] sm:p-[32px] ${className}`}
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {showBadge && <Button variant="featuredBadge">{badgeText}</Button>}

      <div className="w-full flex items-center justify-between">
        <h2 className="text-white text-[20px] sm:text-[24px] font-semibold">{location}</h2>
        <Button variant="nakedButton" onClick={onViewDetails}>
          View Details &gt;
        </Button>
      </div>
    </div>
  );
};

export default FeaturedPropertyCard;