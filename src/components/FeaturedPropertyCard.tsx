import Button from "./Button";

interface FeaturedPropertyCardProps {
  imageUrl: string;
  location: string;
  onViewDetails?: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

const FeaturedPropertyCard = ({
  imageUrl,
  location,
  onViewDetails,
  showBadge = true,
  badgeText = "Featured",
}: FeaturedPropertyCardProps) => {
  return (
    <div
      className="featured-property w-[860px] h-[348px] rounded-[32px] bg-cover bg-center flex flex-col justify-between items-start p-[32px]"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {showBadge && <Button variant="featuredBadge">{badgeText}</Button>}

      <div className="w-full flex items-center justify-between">
        <h2 className="text-white text-[24px] font-semibold">{location}</h2>
        <Button variant="nakedButton" onClick={onViewDetails}>
          View Details &gt;
        </Button>
      </div>
    </div>
  );
};

export default FeaturedPropertyCard;
