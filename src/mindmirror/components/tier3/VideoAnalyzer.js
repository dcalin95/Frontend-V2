import React, { useState, useRef } from 'react';
import './VideoAnalyzer.css';

const VideoAnalyzer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorder = useRef(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        setVideoData(URL.createObjectURL(event.data));
      };
      
      setIsRecording(true);
      mediaRecorder.current.start();
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopVideo = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div className="video-analyzer">
      <h3>Facial Expression Analysis</h3>
      
      <div className="video-container">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="video-preview"
        />
        
        <div className="video-controls">
          <button 
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopVideo : startVideo}
          >
            {isRecording ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="expression-metrics">
          <div className="metric">
            <span className="metric-label">Joy</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '70%' }}></div>
            </div>
          </div>
          <div className="metric">
            <span className="metric-label">Focus</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '85%' }}></div>
            </div>
          </div>
          <div className="metric">
            <span className="metric-label">Engagement</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzer;











