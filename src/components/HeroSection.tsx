import "../styles/global.css";
import FeaturedPropertyCard from "./FeaturedPropertyCard";
import CtaCard from "./CtaCard";
import SearchBar from "./SearchBar";
import HeroImage from "../assets/hero-image.jpg";
const HeroSection = () => {
  return (
    <section className="hero-section mt-[36px] flex flex-col items-start justify-center gap-[22px]">
      <h1 className="heading1">Let Us Find The Perfect Place For You</h1>

      <div className="bento1 flex flex-col items-center justify-center gap-[32px]">
        <div className="bento2 flex items-center justify-center gap-[32px]">
          <FeaturedPropertyCard
            imageUrl={HeroImage}
            location="Tabokoto, GM"
            onViewDetails={() =>
              console.log("Navigating to property details...")
            }
          />
          <CtaCard />
        </div>

        <SearchBar />
      </div>
    </section>
  );
};

export default HeroSection;
