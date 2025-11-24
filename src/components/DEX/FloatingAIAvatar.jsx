import React, { useState, useEffect, useRef } from 'react';
import aiVideo from '../../assets/BitSwapDEX_AI.mp4';
import bitsLogo from '../../assets/logo.png';
import './FloatingAIAvatar.css';

/**
 * Floating AI Avatar Component
 * Appears randomly in UI with AI video and links to AI Intelligence
 * DRAGGABLE - Can be moved with mouse
 * VIDEO with fade transitions and BITS logo between loops
 */
const FloatingAIAvatar = ({ onNavigate }) => {
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [showLogo, setShowLogo] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const avatarRef = useRef(null);
  const videoRef = useRef(null);

  // Random position on mount
  useEffect(() => {
    const randomizePosition = () => {
      const positions = [
        { x: window.innerWidth - 120, y: window.innerHeight - 180 },
        { x: window.innerWidth / 2 - 60, y: window.innerHeight - 180 },
        { x: window.innerWidth - 120, y: 80 },
        { x: window.innerWidth - 120, y: window.innerHeight / 2 - 80 },
        { x: 340, y: window.innerHeight - 180 },
      ];

      const randomPos = positions[Math.floor(Math.random() * positions.length)];
      setCurrentPos(randomPos);
    };

    randomizePosition();
    const interval = setInterval(randomizePosition, 30000);
    return () => clearInterval(interval);
  }, []);

  // Video loop with BITS logo transition
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      // Fade out video
      setVideoOpacity(0);
      
      setTimeout(() => {
        // Show BITS logo
        setShowLogo(true);
        
        setTimeout(() => {
          // Hide logo and restart video
          setShowLogo(false);
          video.currentTime = 0;
          video.play();
          
          setTimeout(() => {
            // Fade in video
            setVideoOpacity(1);
          }, 200);
        }, 2400); // Show logo for 2400ms (800ms x 3 = 200% increase)
      }, 800); // Fade out duration (400ms x 2 = 200% increase)
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, []);

  // Mouse down - Start dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    });
  };

  // Mouse move - Update position
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const maxX = window.innerWidth - 120;
      const maxY = window.innerHeight - 180;

      setCurrentPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleClick = () => {
    if (!isDragging && onNavigate) {
      onNavigate('ai-intelligence');
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={avatarRef}
      className={`floating-ai-avatar ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${currentPos.x}px`,
        top: `${currentPos.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Drag to move • Click to open AI Intelligence"
    >
      {/* Video Avatar */}
      <div className="floating-ai-video-container">
        <video 
          ref={videoRef}
          src={aiVideo} 
          autoPlay 
          muted 
          playsInline 
          className="floating-ai-video"
          style={{ opacity: videoOpacity }}
        />
        
        {/* BITS Logo Overlay */}
        {showLogo && (
          <div className="floating-ai-logo-overlay">
            <img 
              src={bitsLogo} 
              alt="BITS" 
              className="floating-ai-bits-logo"
            />
          </div>
        )}
        
        <div className="floating-ai-glow-ring"></div>
        <div className="floating-ai-pulse-ring"></div>
      </div>

      {/* Text Below */}
      <div className="floating-ai-text">
        <span className="floating-ai-brand">AI BITS</span>
        <div className="floating-ai-status">
          <span className="floating-ai-dot"></span>
          <span>is LIVE</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      <div className="floating-ai-tooltip">
        {isDragging ? 'Release to drop' : 'Drag to move • Click for AI'}
      </div>
    </div>
  );
};

export default FloatingAIAvatar;

