import Navbar from "../components/Navbar";
import "../styles/global.css";
import heroImage from "../assets/hero-image.jpg";
import listing1 from "../assets/listing-01.jpg";
import listing2 from "../assets/listing-02.jpg";
import listing3 from "../assets/listing-03.jpg";
import listing4 from "../assets/listing-04.jpg";
import { Wifi, Utensils, Waves, Mountain, Droplet } from 'lucide-react';
import Button from "../components/Button";
const MockPage = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-[32px] font-semibold mb-[24px]">
          Premium Quality Apartment
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[8px] mb-4 rounded-outer">
          <div>
            <img
              src={heroImage}
              alt="Hero"
              className="w-full h-full object-cover sharp-inner"
            />
          </div>
          <div className="grid grid-cols-2 gap-[8px]">
            <div className="relative">
              <img
                src={listing1}
                alt=""
                className="object-cover h-[256.5px] w-full sharp-inner"
              />
            </div>
            <div className="relative">
              <img
                src={listing2}
                alt=""
                className="object-cover h-[256.5px] w-full sharp-inner"
              />
            </div>
            <div className="relative">
              <img
                src={listing3}
                alt=""
                className="object-cover h-[256.5px] w-full sharp-inner"
              />
            </div>
            <div className="relative">
              <img
                src={listing4}
                alt=""
                className="object-cover h-[256.5px] w-full sharp-inner"
              />
              <Button variant="white" className="absolute bottom-3 right-3">
                View All Photos
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-[32px] font-semibold mb-1">Home In Tabokoto, GM</h2>
          <p className="text-gray-600 text-[20px] mb-4">
            201 Davido Street <br /> Tabokoto GM
          </p>
        </div>

        {/* Main Info Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-between">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              {/* Property Features */}
              <div className="flex flex-wrap gap-2 mb-4 w-[500px]">
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  3 bedrooms
                </span>
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  3 master bedrooms
                </span>
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  1 big kitchen
                </span>
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  2 bathrooms
                </span>
                <span className="px-[24px] py-[8px] bg-gray-200 rounded-full text-sm">
                  2 toilets
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex flex-col justify-center item-start mb-2">
                <p className="text-[32px] font-semibold text-black">
                  GMD 20,000/m
                </p>
                <p className="text-sm text-gray-500">+6 months down-payment</p>
              </div>
              <a href="#" className=" text-[#388e3c] text-[16px] underline">
                Pricing details and terms
              </a>
            </div>

            {/* Agent Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">Agent</p>
                <p className="text-sm text-gray-700">Johnny K Komman</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-2">
              <Button variant="colored">Book a Consultation</Button>
              <Button variant="white">Chat Now</Button>
            </div>

            <div className="ml-4 mb-8">
              <a href="#" className="text-[#388e3c] text-[16px] underline">
                Report this listing
              </a>
            </div>

            {/* Where You'll Sleep */}
            <div className="w-[479px]">
              <h3 className="text-lg font-semibold mb-4">Where You'll Sleep</h3>
              <div className="flex flex-col gap-4">
                <img
                  src={listing1}
                  alt="Bedroom"
                  className=" object-cover rounded-[16px] w-[480px] h-[218px]"
                />
                <div className="flex-1">
                  <p className="text-[24px] font-medium ">Bedroom</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[20px] text-gray-600 mb-2">
                      King-Sized Bedroom
                    </p>
                    <a href="#" className="text-[#388e3c] text-[20px] underline">
                      View all photos &gt;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 w-[633px]">
            <div>
              <h3 className="text-[24px] font-semibold mb-3">
                Property Description
              </h3>
              <p className="text-[18px] text-gray-700 leading-[36px]">
                Nestled in the heart of Lekki Phase 1, this stunning 3-bedroom
                apartment offers modern comfort with a touch of luxury.
                Featuring spacious en-suite bedrooms, a sleek kitchen, and
                panoramic windows that let in natural light. Ideal for families
                or professionals. Residents enjoy 24/7 security, ample parking,
                and proximity to major malls, schools, and restaurants. This
                property combines style, convenience, and location into one
                perfect living space.
              </p>
            </div>

            <div>
              <h3 className="text-[24px] font-semibold mb-[24px] ">
                What This Place Offers
              </h3>
              <div className="grid grid-cols-2 gap-y-[24px] gap-x-4 text-[20px]">
                <div className="flex items-center gap-2">
                  <span><Wifi/></span>
                  <span>Wifi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Utensils/></span>
                  <span>Big Kitchen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Utensils/></span>
                  <span>Big Kitchen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Mountain/></span>
                  <span>Great View</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Waves/></span>
                  <span>Pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Droplet/></span>
                  <span>Borehole Water</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Mountain/></span>
                  <span>Great View</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Wifi/></span>
                  <span>Wifi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Droplet/></span>
                  <span>Borehole Water</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><Waves/></span>
                  <span>Pool</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-10">
          This is a mock page for testing purposes.
        </p>
      </div>
    </div>
  );
};

export default MockPage;
