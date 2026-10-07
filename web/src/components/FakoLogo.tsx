import React from "react";

export interface FakoLogoProps {
  size?: "small" | "medium" | "large";
  textColor?: string;
  className?: string;
  subtitle?: string;
}

export const FakoLogo: React.FC<FakoLogoProps> = ({
  size = "medium",
  textColor,
  className = "",
  subtitle,
}) => {
  return (
    <div className={`fako-logo-wrapper size-${size} ${className}`} aria-label="FAKO">
      <div className="fako-logo-segments" aria-hidden="true">
        <span className="logo-seg seg-light-1" />
        <span className="logo-seg seg-light-2" />
        <span className="logo-seg seg-dark" />
        <span className="logo-apple-dot" />
      </div>
      <div className="fako-logo-text-col">
        <span
          className="fako-logo-text"
          style={textColor ? { color: textColor } : undefined}
        >
          FAKO
        </span>
        {subtitle && <span className="fako-logo-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};
