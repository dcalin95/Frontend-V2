import React, { useState, useRef } from 'react';
import './VideoControl.css';

const VideoControl = () => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsVideoActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsVideoActive(false);
    }
  };

  return (
    <div className="video-control">
      <div className="video-container">
        {isVideoActive ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="video-feed"
          />
        ) : (
          <div className="video-placeholder">
            Camera feed will appear here
          </div>
        )}
      </div>
      
      <button 
        className={`video-button ${isVideoActive ? 'active' : ''}`}
        onClick={isVideoActive ? stopVideo : startVideo}
      >
        {isVideoActive ? 'Stop Camera' : 'Start Camera'}
      </button>
    </div>
  );
};

export default VideoControl;