import React from "react";
import styles from "../BoosterSummary.module.css";

const ModernCard = ({ children, variant = "default", className = "" }) => {
  // SOLANA/AI STYLE - Using CSS classes instead of inline styles
  const baseClass = styles.aiRow || "";
  
  const variantClasses = {
    default: "",
    premium: styles.claudePremium || "",
    highlight: styles.claudeHighlight || ""
  };

  const cardClass = `${baseClass} ${variantClasses[variant] || ""} ${className}`.trim();

  return (
    <div 
      className={cardClass}
    >
      {children}
    </div>
  );
};

export default ModernCard;



