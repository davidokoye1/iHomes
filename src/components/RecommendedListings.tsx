import Button from "./Button";
import ListingCard from "./ListingCard";
import listingImage1 from "../assets/listing-01.jpg";
import listingImage2 from "../assets/listing-02.jpg";
import listingImage3 from "../assets/listing-03.jpg";
import listingImage4 from "../assets/listing-04.jpg";
import "../styles/global.css";

const listings = [
  {
    imageUrl: listingImage1,
    price: "GMD 20,000/m",
    bedrooms: 2,
    bathrooms: 1,
    addressLine1: "201 Davido Street",
    addressLine2: "Tabokoto, GM",
  },
  {
    imageUrl: listingImage2,
    price: "GMD 25,000/m",
    bedrooms: 3,
    bathrooms: 2,
    addressLine1: "123 Main Street",
    addressLine2: "Tabokoto, GM",
  },
  {
    imageUrl: listingImage3,
    price: "GMD 30,000/m",
    bedrooms: 4,
    bathrooms: 3,
    addressLine1: "456 Elm Street",
    addressLine2: "Tabokoto, GM",
  },
  {
    imageUrl: listingImage4,
    price: "GMD 15,000/m",
    bedrooms: 1,
    bathrooms: 1,
    addressLine1: "789 Oak Street",
    addressLine2: "Tabokoto, GM",
  },
];

const RecommendedListings = () => {
  return (
    <section className="recommended-listings-container w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h2 className="text-2xl font-semibold">Places Near You &gt;</h2>
        <Button className="border-gray-300" variant="viewAll">
          View all &gt;
        </Button>
      </div>

      {/* Listings Scrollable Row */}
      <div className="flex overflow-x-auto hide-scrollbar">
        {listings.map((listing, index) => (
          <ListingCard key={index} {...listing} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedListings;
