import React from 'react';
import { motion } from 'framer-motion';

const TopicCard = ({ topic, onClick, delay = 0 }) => {
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      case 'Expert': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return '🌱';
      case 'Intermediate': return '⚡';
      case 'Advanced': return '🚀';
      case 'Expert': return '🧠';
      default: return '📚';
    }
  };

  return (
    <motion.div
      className="topic-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        scale: 1.02,
        y: -3
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Background Gradient Overlay */}
      <div 
        className="card-gradient-bg"
        style={{ 
          background: topic.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      />
      
      {/* AI Glow Effect */}
      <div className="card-ai-glow" />
      
      {/* Card Header */}
      <div className="card-header-ai">
        <div className="topic-icon">
          {topic.icon}
        </div>
        <div className="difficulty-badge-ai" style={{ backgroundColor: getDifficultyColor(topic.difficulty) }}>
          <span className="difficulty-icon">{getDifficultyIcon(topic.difficulty)}</span>
          <span className="difficulty-text">{topic.difficulty}</span>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="card-content-ai">
        <h3 className="topic-title">{topic.title}</h3>
        <p className="topic-description">{topic.description}</p>
      </div>

      {/* Progress Section */}
      <div className="progress-section-ai">
        <div className="progress-info">
          <span className="progress-label">Learning Progress</span>
          <span className="progress-percentage">{topic.progress || 0}%</span>
        </div>
        <div className="progress-bar-ai">
          <div 
            className="progress-fill-ai" 
            style={{ 
              width: `${topic.progress || 0}%`,
              background: getDifficultyColor(topic.difficulty)
            }}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="card-action-ai">
        <motion.div 
          className="start-button-ai"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="action-icon">🎯</span>
          <span className="action-text">Start Learning</span>
          <span className="action-arrow">→</span>
        </motion.div>
      </div>

      {/* Hover Overlay */}
      <div className="hover-overlay-ai">
        <div className="hover-content">
          <span className="hover-text">Click to Begin</span>
          <div className="hover-particles">
            <div className="particle particle-1">✨</div>
            <div className="particle particle-2">⚡</div>
            <div className="particle particle-3">🚀</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopicCard;






