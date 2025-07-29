import React from "react";
import "../styles/global.css";
import { CaretDown } from "phosphor-react";

interface ButtonProps {
  variant?: "white" | "black" | "colored" | "search" | "viewAll" | "featuredBadge" | "nakedButton";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  showIcon?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  white: "white-button",
  black: "black-button",
  colored: "colored-button",
  search: "search-button",
  viewAll: "viewAll",
  featuredBadge: "featured-badge",
  nakedButton: "naked-button",
};

const Button: React.FC<ButtonProps> = ({
  variant = "white",
  onClick,
  disabled = false,
  children,
  className = "",
  type = "button",
  showIcon = false,
}) => {
  const baseClasses = "base-styles flex items-center justify-center gap-[4px]";
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    disabled ? "opacity-50 cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={combinedClasses}>
      {children}
      {showIcon && <CaretDown size={24} weight="regular" color="#000" />}
    </button>
  );
};

export default Button;
