import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogoIcon from "../assets/Path.png"; // Assuming you have a logo icon
import {
  Car,
  ArrowLeft,
  Calendar,
  Eye,
  Grid3X3,
  Home,
  Wifi,
  Utensils,
  Droplet,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import { PropertiesService } from "../services/properties";
import type { PropertyWithImages, PropertyListing } from "../types/database";
import type {Profile} from "../types/database"
const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [suggestions, setSuggestions] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty(id);
    }
  }, [id]);

  const fetchProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      const [propertyData, suggestionsData] = await Promise.all([
        PropertiesService.getPropertyById(propertyId),
        PropertiesService.getPropertySuggestions(propertyId),
      ]);

      if (propertyData) {
        setProperty(propertyData);
        setSuggestions(suggestionsData);

        // Record property view
        PropertiesService.recordPropertyView(propertyId);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const ContactForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold mb-6">Contact Agent</h3>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              rows={4}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="I'm interested in this property..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="colored"
              className="flex-1 py-3"
              onClick={() => setShowContactForm(false)}
            >
              Send Message
            </Button>
            <Button
              variant="white"
              className="py-3"
              onClick={() => setShowContactForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />

        <div className="flex flex-1 justify-center items-center">
          <div className="relative flex items-center justify-center">
            {/* Outer Spinner Circle */}
            <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-[#5dd27c] animate-spin"></div>

            {/* Inner Dot or Logo/Icon (optional) */}
            <div className="absolute h-6 w-6"><img src={LogoIcon} alt="" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Property not found
          </h2>
          <Button onClick={() => navigate("/")} variant="colored">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = property.images[currentImageIndex];

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Results
        </button>

        {/* Title */}
        <h1 className="text-[32px] font-semibold mb-[24px]">
          {property.title}
        </h1>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[8px] mb-4 rounded-outer">
          <div className="h-[513px]">
            {property.images.length > 0 ? (
              <img
                src={currentImage?.image_url || "/placeholder-property.jpg"}
                alt={property.title}
                className="w-full h-full object-cover sharp-inner bg-gray-100"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center sharp-inner">
                <div className="text-center">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <span className="text-gray-500 text-lg">
                    No images available
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-[8px]">
            {property.images.slice(1, 5).map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.image_url}
                  alt={`Property image ${index + 2}`}
                  className="object-cover h-[256.5px] w-full sharp-inner cursor-pointer bg-gray-100"
                  onClick={() => setCurrentImageIndex(index + 1)}
                />
                {index === 3 && property.images.length > 5 && (
                  <Button variant="white" className="absolute bottom-3 right-3">
                    View All Photos
                  </Button>
                )}
              </div>
            ))}

            {/*/!* Fill remaining slots if less than 4 additional images *!/*/}
            {/*{Array.from(*/}
            {/*  { length: Math.max(0, 4 - (property.images.length - 1)) },*/}
            {/*  (_, index) => (*/}
            {/*    <div*/}
            {/*      key={`placeholder-${index}`}*/}
            {/*      className="bg-gray-200 h-[256.5px] w-full sharp-inner flex items-center justify-center"*/}
            {/*    >*/}
            {/*      <Home className="h-8 w-8 text-gray-400" />*/}
            {/*    </div>*/}
            {/*  )*/}
            {/*)}*/}
          </div>
        </div>

        {/* Location and Property Info */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[32px] font-semibold mb-1">
            {property.property_type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} In {property.city}, GM
          </h2>
          <p className="text-gray-600 text-[20px] mb-4">
            {property.address} <br />
            {property.city}, GM
          </p>
        </div>

        {/* Main Info Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-between">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Features */}
            <div className="flex flex-wrap gap-2 mb-4 w-[500px]">
              {property.bedrooms && (
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  {property.bedrooms} bedrooms
                </span>
              )}
              {property.bathrooms && (
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  {property.bathrooms} bathrooms
                </span>
              )}
              {property.square_feet && (
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  {property.square_feet.toLocaleString()} sq ft
                </span>
              )}
              {property.parking_spaces > 0 && (
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  {property.parking_spaces} parking spaces
                </span>
              )}
              {property.is_furnished && (
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  Furnished
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex flex-col justify-center item-start mb-2">
                <p className="text-[32px] font-semibold text-black">
                  D{property.price.toLocaleString()}
                  {property.listing_type === "rent" ? "/m" : ""}
                </p>
                {property.listing_type === "rent" && (
                  <p className="text-sm text-gray-500">
                    +6 months down-payment
                  </p>
                )}
              </div>
              <a href="#" className="text-[#388e3c] text-[16px] underline">
                Pricing details and terms
              </a>
            </div>

            {/* Agent Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">A</span>
              </div>
              <div>
                <p className="font-medium text-sm">{property.agent_name}</p>
                <p className="text-sm text-gray-700">{property.agency_name}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-2">
              <Button
                variant="colored"
                onClick={() => setShowContactForm(true)}
              >
                Book a Consultation
              </Button>
              <Button variant="white" onClick={() => setShowContactForm(true)}>
                Chat Now
              </Button>
            </div>

            <div className="ml-4 mb-8">
              <a href="#" className="text-[#388e3c] text-[16px] underline">
                Report this listing
              </a>
            </div>

            {/* Featured Image Section */}
            {property.images.length > 0 && (
              <div className="w-[479px]">
                <h3 className="text-lg font-semibold mb-4">Featured View</h3>
                <div className="flex flex-col gap-4">
                  <img
                    src={
                      property.images[0]?.image_url ||
                      "/placeholder-property.jpg"
                    }
                    alt="Featured view"
                    className="object-cover rounded-[16px] w-[480px] h-[218px]"
                  />
                  <div className="flex-1">
                    <p className="text-[24px] font-medium">Property View</p>
                    <div className="flex justify-between items-center">
                      <p className="text-[20px] text-gray-600 mb-2">
                        {property.property_type} Interior
                      </p>
                      <a
                        href="#"
                        className="text-[#388e3c] text-[20px] underline"
                      >
                        View all photos &gt;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 w-[633px]">
            {/* Property Description */}
            {property.description && (
              <div>
                <h3 className="text-[24px] font-semibold mb-3">
                  Property Description
                </h3>
                <p className="text-[18px] text-gray-700 leading-[36px]">
                  {property.description}
                </p>
              </div>
            )}

            {/* What This Place Offers */}
            <div>
              <h3 className="text-[24px] font-semibold mb-[24px]">
                What This Place Offers
              </h3>
              <div className="grid grid-cols-2 gap-y-[24px] gap-x-4 text-[20px]">
                
                {property.is_furnished && (
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <span>Furnished</span>
                  </div>
                )}
                {property.parking_spaces > 0 && (
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    <span>Parking</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  <span>Wifi Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  <span>Kitchen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="h-5 w-5" />
                  <span>Water Supply</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <span>Great View</span>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-blue-600" />
                Property Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">
                    Property Type
                  </span>
                  <span className="font-semibold capitalize text-gray-900">
                    {property.property_type}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">
                    Listing Type
                  </span>
                  <span className="font-semibold capitalize text-gray-900">
                    For {property.listing_type}
                  </span>
                </div>
                {property.year_built && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">
                      Year Built
                    </span>
                    <span className="font-semibold text-gray-900">
                      {property.year_built}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Views
                  </span>
                  <span className="font-semibold text-gray-900">
                    {property.views_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Listed
                  </span>
                  <span className="font-semibold text-gray-900">
                    {new Date(property.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {suggestions.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Similar Properties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestions.map((suggestion) => (
                <ListingCard
                  key={suggestion.id}
                  id={suggestion.id}
                  imageUrl={
                    suggestion.primary_image || "/placeholder-property.jpg"
                  }
                  price={`D${suggestion.price.toLocaleString()}`}
                  bedrooms={suggestion.bedrooms || 0}
                  bathrooms={suggestion.bathrooms || 0}
                  addressLine1={suggestion.address}
                  addressLine2={`${suggestion.city}, Gambia`}
                  propertyType={suggestion.property_type}
                  listingType={suggestion.listing_type}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-10">
          Property details and information subject to verification.
        </p>
      </div>

      {showContactForm && <ContactForm />}
    </div>
  );
};

export default PropertyDetails;
