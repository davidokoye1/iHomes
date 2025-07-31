import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Car, 
  Phone, 
  Mail,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  Star,
  Check,
  Grid3X3,
  Home
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ListingCard from '../components/ListingCard';
import { PropertiesService } from '../services/properties';
import type { PropertyWithImages, PropertyListing } from '../types/database';

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [suggestions, setSuggestions] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
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
        PropertiesService.getPropertySuggestions(propertyId)
      ]);

      if (propertyData) {
        setProperty(propertyData);
        setSuggestions(suggestionsData);
        
        // Record property view
        PropertiesService.recordPropertyView(propertyId);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const ContactForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold mb-6">Contact Agent</h3>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input 
              type="text" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
            <input 
              type="tel" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Property not found</h2>
          <Button onClick={() => navigate('/')} variant="colored">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = property.images[currentImageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Results
          </button>
          
          <div className="flex items-center gap-3">
            {property.featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <Star className="h-4 w-4 fill-current" />
                Featured
              </span>
            )}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              property.listing_type === 'sale' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              For {property.listing_type}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-8">
              <div className="relative h-[500px]">
                {property.images.length > 0 ? (
                  <>
                    <img
                      src={currentImage?.image_url || '/placeholder-property.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>
                    
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-200"
                        >
                          <ChevronLeft className="h-6 w-6 text-gray-700" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl rounded-full p-3 transition-all duration-200"
                        >
                          <ChevronRight className="h-6 w-6 text-gray-700" />
                        </button>
                      </>
                    )}

                    {property.images.length > 1 && (
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
                        {property.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              index === currentImageIndex 
                                ? 'border-white shadow-lg' 
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={image.image_url}
                              alt={`Property image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <span className="text-gray-500 text-lg">No images available</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">{property.title}</h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-lg">{property.address}, {property.city}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-blue-600">
                        D{property.price.toLocaleString()}
                      </span>
                      {property.listing_type === 'rent' && (
                        <span className="text-xl text-gray-500">/month</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 ml-6">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200"
                    >
                      <Heart 
                        className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                      />
                    </button>
                    <button className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200">
                      <Share2 className="h-6 w-6 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {property.bedrooms && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Bed className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Bath className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                  )}
                  {property.square_feet && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Square className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{property.square_feet.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Sq Ft</div>
                    </div>
                  )}
                  {property.parking_spaces > 0 && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Car className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{property.parking_spaces}</div>
                      <div className="text-sm text-gray-600">Parking</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {property.description && (
              <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Property</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Features & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.has_pool && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-800 font-medium">Swimming Pool</span>
                  </div>
                )}
                {property.has_garden && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-800 font-medium">Garden</span>
                  </div>
                )}
                {property.is_furnished && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-800 font-medium">Furnished</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-100">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    A
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Property Agent
                </h3>
                <p className="text-gray-600">Contact for details</p>
              </div>
              
              <div className="space-y-4 mb-6">
              </div>

              <div className="space-y-3">
                <Button 
                  variant="colored" 
                  className="w-full py-4 text-lg font-semibold"
                  onClick={() => setShowContactForm(true)}
                >
                  Send Message
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-blue-600" />
                Property Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Property Type</span>
                  <span className="font-semibold capitalize text-gray-900">{property.property_type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Listing Type</span>
                  <span className="font-semibold capitalize text-gray-900">For {property.listing_type}</span>
                </div>
                {property.year_built && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Year Built</span>
                    <span className="font-semibold text-gray-900">{property.year_built}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Views
                  </span>
                  <span className="font-semibold text-gray-900">{property.views_count.toLocaleString()}</span>
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

        {suggestions.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Similar Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestions.map((suggestion) => (
                <ListingCard
                  key={suggestion.id}
                  id={suggestion.id}
                  imageUrl={suggestion.primary_image || '/placeholder-property.jpg'}
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
      </div>

      {showContactForm && <ContactForm />}
    </div>
  );
};

export default PropertyDetails;
