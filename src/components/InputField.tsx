// src/components/InputField.tsx
interface InputFieldProps {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({
  type,
  name,
  placeholder,
  value,
  onChange,
}: InputFieldProps) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className="auth-input"
      value={value}
      onChange={onChange}
    />
  );
};

export default InputField;
