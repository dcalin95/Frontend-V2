import React, { Suspense, lazy } from 'react';

// Lazy load components
const VoiceAnalyzer = lazy(() => import('./tier3/VoiceAnalyzer'));
const VideoAnalyzer = lazy(() => import('./tier3/VideoAnalyzer'));
const SmartRingFuture = lazy(() => import('./tier4/SmartRingFuture'));
const AchievementSystem = lazy(() => import('./achievements/AchievementSystem'));

const LoadingFallback = () => (
  <div className="tier-loading">
    <div className="loading-spinner"></div>
    <p>Loading advanced features...</p>
  </div>
);

const LazyTier = ({ tier, ...props }) => {
  const renderTierComponent = () => {
    switch(tier) {
      case 'TIER3_VOICE':
        return <VoiceAnalyzer {...props} />;
      case 'TIER3_VIDEO':
        return <VideoAnalyzer {...props} />;
      case 'TIER4':
        return <SmartRingFuture {...props} />;
      case 'ACHIEVEMENTS':
        return <AchievementSystem {...props} />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      {renderTierComponent()}
    </Suspense>
  );
};

export default React.memo(LazyTier);










