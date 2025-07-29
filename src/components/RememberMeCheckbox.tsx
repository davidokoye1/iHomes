// src/components/RememberMeCheckbox.tsx
interface RememberMeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const RememberMeCheckbox = ({ checked, onChange }: RememberMeCheckboxProps) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer font-inter text-black">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="h-5 w-5 rounded-sm bg-[#c8e6c9] bg-opacity-30 border-[#7fd783] opacity-50 
        peer-checked:bg-[#4caf50] peer-checked:bg-opacity-100 peer-checked:border-[#7fd783] peer-checked:opacity-100
        peer-checked:after:content-['✔'] peer-checked:after:text-white peer-checked:after:text-[11px] 
        peer-checked:after:font-bold peer-checked:after:flex peer-checked:after:items-center 
        peer-checked:after:justify-center peer-checked:after:h-full peer-checked:after:w-full 
        transition-all duration-200 flex items-center justify-center"
      />
      <span className="leading-5">Remember me</span>
    </label>
  );
};

export default RememberMeCheckbox;
