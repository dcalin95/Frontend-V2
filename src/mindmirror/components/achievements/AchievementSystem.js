import React, { useState, useEffect } from 'react';
import './AchievementSystem.css';

const ACHIEVEMENTS = {
  FIRST_ANALYSIS: {
    id: 'first_analysis',
    title: 'First Mind Analysis',
    description: 'Complete your first thought analysis',
    icon: '🎯'
  },
  WORD_MASTER: {
    id: 'word_master',
    title: 'Word Master',
    description: 'Reach 1000 words in a single analysis',
    icon: '📚'
  },
  VOICE_PIONEER: {
    id: 'voice_pioneer',
    title: 'Voice Pioneer',
    description: 'Complete your first voice analysis',
    icon: '🎤'
  },
  EXPRESSION_MASTER: {
    id: 'expression_master',
    title: 'Expression Master',
    description: 'Achieve 90%+ engagement in facial analysis',
    icon: '😊'
  },
  NFT_CREATOR: {
    id: 'nft_creator',
    title: 'NFT Creator',
    description: 'Mint your first Mind NFT',
    icon: '🎨'
  }
};

const Achievement = ({ achievement, unlocked, progress = 100 }) => (
  <div className={`achievement ${unlocked ? 'unlocked' : ''}`}>
    <div className="achievement-icon">{achievement.icon}</div>
    <div className="achievement-info">
      <h4>{achievement.title}</h4>
      <p>{achievement.description}</p>
      <div className="achievement-progress">
        <div 
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
    {unlocked && <div className="achievement-complete">✓</div>}
  </div>
);

const AchievementSystem = () => {
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const handleAchievement = (event) => {
      const { achievementId, progressValue } = event.detail;
      
      if (progressValue) {
        setProgress(prev => ({
          ...prev,
          [achievementId]: progressValue
        }));
      }

      if (!unlockedAchievements.has(achievementId)) {
        setUnlockedAchievements(prev => new Set([...prev, achievementId]));
        // Trigger notification
        window.dispatchEvent(new CustomEvent('mind_event', {
          detail: {
            type: 'achievement_unlocked',
            achievement: ACHIEVEMENTS[achievementId]
          }
        }));
      }
    };

    window.addEventListener('achievement_unlocked', handleAchievement);
    return () => window.removeEventListener('achievement_unlocked', handleAchievement);
  }, [unlockedAchievements]);

  return (
    <div className="achievements-panel">
      <h3>Mind Achievements</h3>
      <div className="achievements-grid">
        {Object.values(ACHIEVEMENTS).map(achievement => (
          <Achievement
            key={achievement.id}
            achievement={achievement}
            unlocked={unlockedAchievements.has(achievement.id)}
            progress={progress[achievement.id] || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default AchievementSystem;

// Helper pentru deblocarea achievements
export const unlockAchievement = (achievementId, progress) => {
  window.dispatchEvent(new CustomEvent('achievement_unlocked', {
    detail: { achievementId, progressValue: progress }
  }));
};










