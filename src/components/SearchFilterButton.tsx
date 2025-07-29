// components/SearchFilterButton.tsx
import type { LucideIcon } from 'lucide-react';

interface SearchFilterButtonProps {
  label: string;
  value: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export default function SearchFilterButton({
  label,
  value,
  icon: Icon,
  onClick,
}: SearchFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-[8px] rounded-full border border-gray-300 pl-[32px] pr-[48px] py-[11px] bg-white hover:shadow-md transition-shadow text-left "
    >
      <Icon className="w-[32px] h-[32px] text-gray-600" strokeWidth={1.5}/>
      <div className="text-[16px] text-gray-700 ">
        <span className="block text-[16px] text-gray-400">{label}</span>
        <span className="font-medium text-[18px]">{value}</span>
      </div>
    </button>
  );
}
