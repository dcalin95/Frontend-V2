import React from "react";

const ModernCard = ({ children, variant = "default", className = "" }) => {
  const baseStyles = {
    background: "rgba(30, 41, 59, 0.6)",
    borderRadius: "12px",
    padding: "16px",
    margin: "6px 0",
    border: "1px solid rgba(148, 163, 184, 0.15)",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease",
    position: "relative",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
  };

  const variants = {
    default: {},
    premium: {
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
      border: "1px solid rgba(59, 130, 246, 0.2)",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)"
    },
    highlight: {
      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.6) 100%)",
      border: "1px solid rgba(16, 185, 129, 0.2)"
    }
  };

  const hoverStyles = {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    borderColor: "rgba(148, 163, 184, 0.3)"
  };

  return (
    <div 
      style={{
        ...baseStyles,
        ...variants[variant]
      }}
      className={className}
      onMouseEnter={(e) => {
        Object.assign(e.target.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "translateY(0)";
        e.target.style.boxShadow = baseStyles.boxShadow;
        e.target.style.borderColor = baseStyles.border.split(' ')[2];
      }}
    >
      {children}
    </div>
  );
};

export default ModernCard;



