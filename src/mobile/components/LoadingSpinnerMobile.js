import React from 'react';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const LoadingSpinnerMobile = ({ message = "Loading..." }) => {
  return (
    <div className="mobile-loading-container">
      <div className="mobile-loading-spinner">
        <Icon name="loading" size="xlarge" animate="spin" className="mobile-loading-icon" />
        <div className="mobile-loading-text">{message}</div>
      </div>
    </div>
  );
};

export default LoadingSpinnerMobile;

