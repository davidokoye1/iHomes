// src/components/InputField.tsx - Enhanced with Brand Styling
interface InputFieldProps {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const InputField = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  disabled = false,
}: InputFieldProps) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className={`auth-input ${className}`}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
    />
  );
};

export default InputField;