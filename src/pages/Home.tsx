import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturedListings from "../components/FeaturedListings";
import RecommendedListings from "../components/RecommendedListings";
const Home = () => {
  return (
    <div>
      <Navbar />
        <HeroSection />
      
      {/* Main Content - Stacked vertically on all screen sizes */}
      <div className="w-full">
        {/* Featured Listings Section */}
        <FeaturedListings />
        
        {/* Recommended Listings Section */}
        <RecommendedListings />
        
        {/* Add other sections here as needed */}
      </div>
    </div>
  );
};

export default Home;
