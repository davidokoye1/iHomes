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
  Sun,
  Shield,
  Trees,
  Layers,
  Shirt,
  
  Zap,
  Waves,
  UserCheck,
  Flame,
  Maximize,
  Lock,
  Building,
  Archive,
  Snowflake,
  Trash,
  Baby,
  ChefHat,
  ParkingCircle,
  Box,
  Dumbbell,
  Briefcase,
  Tv,
  Bath,
  MoveVertical,
  Building2,

  Umbrella,
  DoorOpen,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  MapPin,
  Bed,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import ListingCard from "../components/ListingCard";
import { PropertiesService } from "../services/properties";
import type { PropertyWithImages, PropertyListing } from "../types/database";

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [suggestions, setSuggestions] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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


  // Share function
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `Check out this ${property?.property_type} in ${property?.city}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Unable to copy link');
    });
  };

  // Icon mapping function
  const getAmenityIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'grill': Box,
      'car': Car,
      'building-2': Building2,
      'sun': Sun,
      'shield': Shield,
      'trees': Trees,
      'grid': Grid3X3,
      'umbrella': Umbrella,
      'layers': Layers,
      'shirt': Shirt,
      'stairs': Box,
      'zap': Zap,
      'waves': Waves,
      'droplets': Droplet,
      'flame': Flame,
      'maximize': Maximize,
      'lock': Lock,
      'building': Building,
      'archive': Archive,
      'wifi': Wifi,
      'snowflake': Snowflake,
      'trash': Trash,
      'baby': Baby,
      'home': Home,
      'chef-hat': ChefHat,
      'parking-circle': ParkingCircle,
      'cabinet': Box,
      'dumbbell': Dumbbell,
      'briefcase': Briefcase,
      'tv': Tv,
      'bath': Bath,
      'move-vertical': MoveVertical,
      'door-open': DoorOpen,
      'user-check': UserCheck,
      'utensils': Utensils,
      'eye': Eye
    };
    return iconMap[iconName] || Home;
  };

  const ContactForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl sm:text-2xl font-bold">Contact Agent</h3>
          <button
            onClick={() => setShowContactForm(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              rows={4}
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="I'm interested in this property..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
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

  const ImageGallery = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <button
          onClick={() => setShowImageGallery(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        
        <button
          onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property!.images.length - 1)}
          className="absolute left-4 z-10 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        
        <button
          onClick={() => setCurrentImageIndex(prev => prev < property!.images.length - 1 ? prev + 1 : 0)}
          className="absolute right-4 z-10 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>

        <img
          src={property?.images[currentImageIndex]?.image_url || "/placeholder-property.jpg"}
          alt={`Property image ${currentImageIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
          {currentImageIndex + 1} of {property?.images.length}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex flex-1 justify-center items-center">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-[#5dd27c] animate-spin"></div>
            <div className="absolute h-6 w-6">
              <img src={LogoIcon} alt="" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-12 px-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
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
  const propertyAmenities = property.amenities || [];

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Back to Results</span>
        </button>

        {/* Mobile Header */}
        <div className="block lg:hidden mb-4">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-semibold flex-1 pr-4">
              {property.title}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full border transition-colors ${
                  isFavorite ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-600 mb-4">
            <MapPin className="h-4 w-4" />
            <p className="text-sm">{property.address}, {property.city}, GM</p>
          </div>
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:flex lg:items-start lg:justify-between lg:mb-5">
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              {property.title}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full border transition-colors ${
                isFavorite ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-4 sm:mb-6 lg:mb-6">
          {/* Mobile Image Slider */}
          <div className="block lg:hidden relative">
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden">
              {property.images.length > 0 ? (
                <>
                  <img
                    src={currentImage?.image_url || "/placeholder-property.jpg"}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onClick={() => setShowImageGallery(true)}
                  />
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.images.length - 1)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev < property.images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {property.images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-500">No images available</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Image Grid */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-2 rounded-2xl overflow-hidden">
            <div className="h-[350px]">
              {property.images.length > 0 ? (
                <img
                  src={currentImage?.image_url || "/placeholder-property.jpg"}
                  alt={property.title}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowImageGallery(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <span className="text-gray-500 text-lg">No images available</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {property.images.slice(1, 5).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.image_url}
                    alt={`Property image ${index + 2}`}
                    className="object-cover h-[172px] w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setCurrentImageIndex(index + 1);
                      setShowImageGallery(true);
                    }}
                  />
                  {index === 3 && property.images.length > 5 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Button 
                        variant="white" 
                        className="text-sm"
                        onClick={() => setShowImageGallery(true)}
                      >
                        +{property.images.length - 4} more
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Info Header - Mobile/Tablet */}
        <div className="block lg:hidden mb-6">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-1">
              {property.property_type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} In {property.city}, GM
            </h2>
            <p className="text-gray-600 hidden sm:block">
              {property.address}, {property.city}, GM
            </p>
          </div>

          {/* Property Features - Mobile */}
          <div className="flex flex-wrap gap-2 mb-4">
            {property.bedrooms && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {property.bedrooms} beds
              </span>
            )}
            {property.bathrooms && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {property.bathrooms} baths
              </span>
            )}
            {property.square_feet && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {property.square_feet.toLocaleString()} sq ft
              </span>
            )}
            {property.parking_spaces > 0 && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                <Car className="h-3 w-3" />
                {property.parking_spaces} parking
              </span>
            )}
          </div>

          {/* Price - Mobile */}
          <div className="mb-4">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              D{property.price.toLocaleString()}
              {property.listing_type === "rent" ? "/month" : ""}
            </p>
            {property.listing_type === "rent" && (
              <p className="text-sm text-gray-500">+6 months down-payment</p>
            )}
          </div>

          {/* Action Buttons - Mobile */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button
              variant="colored"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setShowContactForm(true)}
            >
              <Phone className="h-4 w-4" />
              Call Agent
            </Button>
            <Button 
              variant="white" 
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setShowContactForm(true)}
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Location and Property Info - Desktop */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {property.property_type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} In {property.city}, GM
            </h2>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <p className="text-base">{property.address}, {property.city}, GM</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Desktop Property Features */}
            <div className="hidden lg:block">
              <div className="flex flex-wrap gap-3 mb-5">
                {property.bedrooms && (
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    {property.bedrooms} bedrooms
                  </span>
                )}
                {property.bathrooms && (
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms} bathrooms
                  </span>
                )}
                {property.square_feet && (
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
                    {property.square_feet.toLocaleString()} sq ft
                  </span>
                )}
                {property.parking_spaces > 0 && (
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {property.parking_spaces} parking spaces
                  </span>
                )}
                {property.is_furnished && (
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Furnished
                  </span>
                )}
              </div>

              {/* Desktop Price */}
              <div className="mb-6">
                <div className="flex flex-col mb-3">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    D{property.price.toLocaleString()}
                    {property.listing_type === "rent" ? "/month" : ""}
                  </p>
                  {property.listing_type === "rent" && (
                    <p className="text-sm text-gray-500">+6 months down-payment</p>
                  )}
                </div>
                <a href="#" className="text-[#388e3c] text-sm underline hover:text-[#2e7d32] transition-colors">
                  Pricing details and terms
                </a>
              </div>

              {/* Desktop Agent Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {property.agent_name?.[0] || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-base">{property.agent_name}</p>
                  <p className="text-sm text-gray-600">{property.agency_name}</p>
                  {property.agent_phone && (
                    <p className="text-sm text-gray-600">{property.agent_phone}</p>
                  )}
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="flex gap-4 mb-5">
                <Button
                  variant="colored"
                  className="flex items-center gap-2"
                  onClick={() => setShowContactForm(true)}
                >
                  <Phone className="h-4 w-4" />
                  Book a Consultation
                </Button>
                <Button 
                  variant="white" 
                  className="flex items-center gap-2"
                  onClick={() => setShowContactForm(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat Now
                </Button>
              </div>

              <div className="mb-6">
                <a href="#" className="text-[#388e3c] text-sm underline hover:text-[#2e7d32] transition-colors">
                  Report this listing
                </a>
              </div>
            </div>

            {/* Property Description */}
            {property.description && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  About This Property
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">
                  {property.description}
                </p>
              </div>
            )}

            {/* What This Place Offers */}
            {propertyAmenities.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-5">
                  What This Place Offers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {propertyAmenities.map((amenity) => {
                    const IconComponent = getAmenityIcon(amenity.icon_name || 'home');
                    return (
                      <div key={amenity.id} className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <span className="text-base">{amenity.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Featured Image Section - Desktop */}
            {property.images.length > 0 && (
              <div className="hidden lg:block">
                <h3 className="text-lg font-semibold mb-4">Featured View</h3>
                <div className="bg-gray-50 rounded-2xl p-5">
                  <img
                    src={property.images[0]?.image_url || "/placeholder-property.jpg"}
                    alt="Featured view"
                    className="w-full h-40 object-cover rounded-xl mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowImageGallery(true)}
                  />
                  <div>
                    <p className="text-base font-medium mb-2">Property View</p>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 text-sm">
                        {property.property_type} Interior
                      </p>
                      <button 
                        onClick={() => setShowImageGallery(true)}
                        className="text-[#388e3c] hover:text-[#2e7d32] underline transition-colors text-sm"
                      >
                        View all photos →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Mobile Agent Info */}
            <div className="block lg:hidden bg-gray-50 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Agent</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {property.agent_name?.[0] || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{property.agent_name}</p>
                  <p className="text-sm text-gray-600">{property.agency_name}</p>
                  {property.agent_phone && (
                    <p className="text-sm text-gray-600">{property.agent_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-gray-600" />
                Property Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium text-sm">Property Type</span>
                  <span className="font-semibold capitalize text-gray-900 text-sm">
                    {property.property_type}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium text-sm">Listing Type</span>
                  <span className="font-semibold capitalize text-gray-900 text-sm">
                    For {property.listing_type}
                  </span>
                </div>
                {property.year_built && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Year Built</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {property.year_built}
                    </span>
                  </div>
                )}
                {property.floors && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Floors</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {property.floors}
                    </span>
                  </div>
                )}
                {property.lot_size && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm">Lot Size</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {property.lot_size.toLocaleString()} sq ft
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4" />
                    Views
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {property.views_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Listed
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {new Date(property.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Map Placeholder */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                Location
              </h3>
              <div className="bg-gray-200 rounded-xl h-40 flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Interactive map coming soon</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{property.address}</p>
                <p>{property.city}, Gambia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {suggestions.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
              Similar Properties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {suggestions.map((suggestion) => (
                <ListingCard
                  key={suggestion.id}
                  id={suggestion.id}
                  imageUrl={suggestion.primary_image || "/placeholder-property.jpg"}
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

        {/* Additional Mobile Sections */}
        <div className="block lg:hidden mt-8 space-y-6">
          

          {/* Neighborhood Info */}
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              About {property.city}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center bg-white rounded-xl p-3">
                <div className="text-2xl mb-1">🏫</div>
                <p className="font-medium">Schools</p>
                <p className="text-gray-500">8/10 rating</p>
              </div>
              <div className="text-center bg-white rounded-xl p-3">
                <div className="text-2xl mb-1">🚌</div>
                <p className="font-medium">Transit</p>
                <p className="text-gray-500">Good access</p>
              </div>
              <div className="text-center bg-white rounded-xl p-3">
                <div className="text-2xl mb-1">🏪</div>
                <p className="font-medium">Shopping</p>
                <p className="text-gray-500">Nearby</p>
              </div>
              <div className="text-center bg-white rounded-xl p-3">
                <div className="text-2xl mb-1">🏥</div>
                <p className="font-medium">Healthcare</p>
                <p className="text-gray-500">Accessible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Property details and information subject to verification.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
            <span>© 2025 Property Platform</span>
            <span>•</span>
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobile Only */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xl font-bold text-gray-900">
                D{property.price.toLocaleString()}
                {property.listing_type === "rent" ? "/mo" : ""}
              </p>
              <p className="text-sm text-gray-500">
                {property.bedrooms}bed • {property.bathrooms}bath
              </p>
            </div>
            <Button
              variant="colored"
              className="px-6"
              onClick={() => setShowContactForm(true)}
            >
              Contact
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showContactForm && <ContactForm />}
      {showImageGallery && <ImageGallery />}
    </div>
  );
};

export default PropertyDetails;