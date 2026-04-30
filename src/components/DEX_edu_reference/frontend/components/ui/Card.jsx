/**
 * 🎯 Card Component - Binance-Inspired Trading UI
 * 
 * Reusable card/panel component:
 * - Variants: default, elevated, outlined
 * - With header, body, footer
 * - Consistent padding, borders
 * 
 * @module Card
 */

import React from 'react';
import '../../styles/components/ui/card.css';

const Card = React.memo(({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClass = 'ui-card';
  const variantClass = `ui-card-${variant}`;
  const paddingClass = `ui-card-padding-${padding}`;
  const classes = [
    baseClass,
    variantClass,
    paddingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
});

const CardHeader = React.memo(({ children, className = '', ...props }) => (
  <div className={`ui-card-header ${className}`} {...props}>
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.memo(({ children, className = '', ...props }) => (
  <h3 className={`ui-card-title ${className}`} {...props}>
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

const CardBody = React.memo(({ children, className = '', ...props }) => (
  <div className={`ui-card-body ${className}`} {...props}>
    {children}
  </div>
));

CardBody.displayName = 'CardBody';

const CardFooter = React.memo(({ children, className = '', ...props }) => (
  <div className={`ui-card-footer ${className}`} {...props}>
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.displayName = 'Card';

export default Card;
