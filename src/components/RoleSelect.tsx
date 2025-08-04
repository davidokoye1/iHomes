// src/components/RoleSelect.tsx
import Select from "react-select";
import type { StylesConfig } from "react-select"
interface Option {
  value: string;
  label: string;
}

interface RoleSelectProps {
  value: string;
  onChange: (option: Option | null) => void;
}

const roleOptions: Option[] = [
  { value: "user", label: "User" },
  { value: "agent", label: "Agent" },
];

const customStyles: StylesConfig<Option, false> = {
  control: (provided) => ({
    ...provided,
    width: "100%",
    height: "64px",
    borderRadius: "16px",
    border: "2.6px solid #8b8b8b56",
    backgroundColor: "#ffffff",
    fontSize: "20px",
    padding: "10px 32px",
    color: "#333333",
    boxShadow: "none",
    outline: "none",
    "&:hover": { border: "2.6px solid #7fd783" },
  }),
  menu: (provided) => ({
    ...provided,
    padding: "8px",
    borderRadius: "16px",
    marginTop: "4px",
    border: "2.6px solid #7fd783",
  }),
  option: (provided, state) => ({
    ...provided,
    borderRadius: "16px",
    backgroundColor: state.isFocused ? "#7fd783" : "#ffffff",
    color: state.isFocused ? "#ffffff" : "#333333",
    transition: "background-color 0.3s ease, color 0.3s ease",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333333",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#7fd783",
  }),
};

const RoleSelect = ({ value, onChange }: RoleSelectProps) => {
  return (
    <Select
      value={roleOptions.find((opt) => opt.value === value) || null}
      onChange={onChange}
      options={roleOptions}
      placeholder="Select Role"
      styles={customStyles}
      menuPlacement="auto"
      menuPosition="fixed"
    />
  );
};

export default RoleSelect;

