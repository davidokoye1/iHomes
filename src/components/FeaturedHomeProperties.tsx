type FeaturedHomePropertiesProps = {
  value: string | number;
  label: string;
};

const FeaturedHomeProperties = ({ value, label }: FeaturedHomePropertiesProps) => {
  return (
    <div>
      <p className="text-[24px]">{value}</p>
      <p className="text-[16px] font-light">{label}</p>
    </div>
  );
};

export default FeaturedHomeProperties;
