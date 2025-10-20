import React from 'react';
import './SentimentAnalysis.css';

const SentimentAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  const {
    sentiment,
    confidence,
    emotions = {
      joy: 0.2,
      sadness: 0.1,
      anger: 0.05,
      fear: 0.05,
      surprise: 0.3,
      neutral: 0.3
    }
  } = analysis;

  const emotionColors = {
    joy: '#FFD700',
    sadness: '#4169E1',
    anger: '#FF4500',
    fear: '#800080',
    surprise: '#00FF7F',
    neutral: '#A9A9A9'
  };

  return (
    <div className="sentiment-analysis">
      <h3>Advanced Sentiment Analysis</h3>
      
      <div className="sentiment-main">
        <div className="sentiment-score">
          <div className="score-circle" style={{
            background: `conic-gradient(#00ff9d ${confidence * 360}deg, #2a2a2a 0deg)`
          }}>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <p>Confidence Score</p>
        </div>

        <div className="sentiment-details">
          <h4>Primary Sentiment: {sentiment}</h4>
          <div className="emotions-grid">
            {Object.entries(emotions).map(([emotion, value]) => (
              <div key={emotion} className="emotion-bar">
                <div className="emotion-label">{emotion}</div>
                <div className="emotion-progress">
                  <div 
                    className="emotion-fill"
                    style={{
                      width: `${value * 100}%`,
                      backgroundColor: emotionColors[emotion]
                    }}
                  />
                </div>
                <div className="emotion-value">{Math.round(value * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;











