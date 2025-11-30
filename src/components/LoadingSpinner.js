import React from 'react';
import CosmicLoader from './DEX/CosmicLoader';

// 🔄 REDIRECT: This component now points to the OFFICIAL CosmicLoader
// This ensures that any legacy import of "LoadingSpinner" renders the correct BITS Loader.
const LoadingSpinner = (props) => {
  return <CosmicLoader {...props} />;
};

export default LoadingSpinner;
