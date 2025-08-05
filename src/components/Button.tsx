import React from "react";
import { CaretDown } from "phosphor-react";

// Button variant type keeping original naming
type ButtonVariant = 
  | "white" 
  | "black" 
  | "colored" 
  | "search" 
  | "viewAll" 
  | "featuredBadge" 
  | "nakedButton";

// Button size type for better control
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  showIcon?: boolean;
  iconColor?: string;
  fullWidth?: boolean;
}

// Centralized variant styles with original naming
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  colored: {
    padding: "22px 28px",
    borderRadius: "360px",
    background: "linear-gradient(to bottom, #bdf99a, #5dd27c)",
    color: "#ffffff",
    border: "none",
    fontSize: "18px",
    lineHeight: "21px",
  },
  black: {
    padding: "18px 48px",
    borderRadius: "360px",
    background: "#000000",
    color: "#ffffff",
    border: "none",
    fontSize: "18px",
    lineHeight: "21px",
  },
  white: {
    padding: "18px 20px",
    border: "2px solid #5DD27C",
    borderRadius: "360px",
    background: "#ffffff",
    color: "#000000",
    fontSize: "18px",
    lineHeight: "21px",
  },
  search: {
    padding: "24px 48px",
    borderRadius: "360px",
    background: "linear-gradient(to bottom, #bdf99a, #5dd27c)",
    color: "#ffffff",
    border: "none",
  },
  viewAll: {
    padding: "16px 24px",
    borderRadius: "360px",
    background: "#ffffff",
    border: "2px solid #bcbcbc",
    color: "#000000",
    fontSize: "18px",
    lineHeight: "21px",
  },
  featuredBadge: {
    padding: "12px 16px",
    borderRadius: "360px",
    background: "#ffffff",
    color: "#000000",
    fontSize: "12px",
    lineHeight: "14px",
    border: "none",
  },
  nakedButton: {
    background: "transparent",
    border: "none",
    padding: "0",
    color: "#ffffff",
    textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
    fontSize: "18px",
    lineHeight: "21px",
    textAlign: "left" as const,
  },
};

// Size variations - keeping original variant-specific sizing
const sizeStyles: Record<ButtonSize, Partial<React.CSSProperties>> = {
  sm: {
    // Will be overridden by variant styles - keeping for future use
  },
  md: {
    // Default - variant styles will take precedence
  },
  lg: {
    // Will be overridden by variant styles - keeping for future use
  },
};

// Base styles that apply to all buttons
const baseStyles: React.CSSProperties = {
  fontWeight: 400,
  whiteSpace: "nowrap",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  transition: "all 0.2s ease-in-out",
  fontFamily: "inherit",
  outline: "none",
};

// Disabled styles
const disabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
  pointerEvents: "none",
};

// Hover styles per variant (you can expand this)
const getHoverStyles = (variant: ButtonVariant): React.CSSProperties => {
  switch (variant) {
    case "colored":
      return { transform: "translateY(-1px)", filter: "brightness(1.05)" };
    case "white":
      return { backgroundColor: "#f8f9fa", borderColor: "#4ade80" };
    case "black":
      return { backgroundColor: "#333333" };
    case "viewAll":
      return { backgroundColor: "#f8f9fa" };
    default:
      return { transform: "translateY(-1px)" };
  }
};

const Button: React.FC<ButtonProps> = ({
  variant = "white",
  size = "md",
  onClick,
  disabled = false,
  children,
  className = "",
  type = "button",
  showIcon = false,
  iconColor,
  fullWidth = false,
}) => {
  // Combine all styles - variant styles take precedence over size styles
  const buttonStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant], // This ensures variant-specific sizing is preserved
    ...(disabled && disabledStyles),
    ...(fullWidth && { width: "100%" }),
  };

  // Determine icon color based on variant if not provided
  const getIconColor = (): string => {
    if (iconColor) return iconColor;
    
    const lightVariants: ButtonVariant[] = ["white", "viewAll", "featuredBadge"];
    return lightVariants.includes(variant) ? "#000000" : "#ffffff";
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const hoverStyles = getHoverStyles(variant);
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      // Reset to original styles
      Object.assign(e.currentTarget.style, buttonStyles);
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={buttonStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showIcon && (
        <CaretDown 
          size={size === "sm" ? 16 : size === "md" ? 20 : 24} 
          weight="regular" 
          color={getIconColor()} 
        />
      )}
    </button>
  );
};

export default Button;

// Usage examples:
/*
// Basic usage
<Button variant="colored">Click me</Button>

// With icon
<Button variant="white" showIcon>View more</Button>

// Different sizes
<Button variant="black" size="sm">Small</Button>
<Button variant="colored" size="lg">Large</Button>

// Full width
<Button variant="colored" fullWidth>Full width</Button>

// Custom icon color
<Button variant="colored" showIcon iconColor="#ff0000">Custom icon</Button>

// Disabled state
<Button variant="colored" disabled>Disabled</Button>
*/