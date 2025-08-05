// HeroSection.tsx - Fixed Responsive Version
import "../styles/global.css";
import SearchBar from "./SearchBar";


const HeroSection = () => {
  

  return (
    <section className="w-full py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-6 sm:gap-8">
        {/* Hero Title */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Find Your Dream Home In Seconds
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Discover the perfect property in Gambia's most desirable locations
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <SearchBar className="shadow-lg hover:shadow-xl transition-shadow duration-300" />
        </div>

       
      </div>
    </section>
  );
};

export default HeroSection;