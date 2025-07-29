import { MapPin, Home, DollarSign, Expand, SlidersHorizontal } from "lucide-react";
import SearchFilterButton from "./SearchFilterButton";
import Button from "./Button";

const SearchBar = () => (
  <div className="search-bar flex items-center justify-between p-[20px] max-w-[1314px] max-h-[111px] mx-auto">
    <div className="search-bar-items flex items-center justify-between w-full">
      <div className="search-bar-input-fields gap-[16px] flex items-center">
        <SearchFilterButton label="Location" value="Tabokoto, GM" icon={MapPin} />
        <SearchFilterButton label="Property Type" value="Appartment" icon={Home} />
        <SearchFilterButton label="Price Range" value="D2000–D20,000" icon={DollarSign} />
        <SearchFilterButton label="Bedrooms" value="2–5" icon={Expand} />
      </div>
      <div className="h-[72px] w-[2px] bg-gray-200 mx-2" />
      <div className="search-bar-buttons flex items-center gap-2">
        <button
          className="w-[72px] h-[72px] rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
          aria-label="Open Filters"
        >
          <SlidersHorizontal className="w-[24px] text-gray-600" />
        </button>
        <Button variant="colored" className="search-button">Search</Button>
      </div>
    </div>
  </div>
);

export default SearchBar;
