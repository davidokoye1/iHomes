import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import RecommendedListings from "../components/RecommendedListings";
const Home = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <RecommendedListings />
      {/* Add more sections or components as needed */}
    </div>
  );
};

export default Home;
