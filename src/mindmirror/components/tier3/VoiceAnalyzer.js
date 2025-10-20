import React, { useState, useRef, useEffect } from 'react';
import './VoiceAnalyzer.css';

const VoiceVisualizer = ({ audioStream }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!audioStream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        gradient.addColorStop(0, '#00ff9d');
        gradient.addColorStop(1, '#00a3ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      source.disconnect();
      audioContext.close();
    };
  }, [audioStream]);

  return <canvas ref={canvasRef} width="640" height="100" className="voice-visualizer" />;
};

const VoiceAnalyzer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const mediaRecorder = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        setAudioData(URL.createObjectURL(event.data));
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="voice-analyzer">
      <h3>Voice Analysis</h3>
      <div className="voice-controls">
        <button 
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {audioData && (
          <div className="audio-preview">
            <audio src={audioData} controls />
            <button className="analyze-voice-btn">
              Analyze Voice Pattern
            </button>
          </div>
        )}
      </div>
      
      {audioData && (
        <div className="voice-metrics">
          <div className="metric">
            <h4>Emotional State</h4>
            <div className="metric-value">Calm</div>
          </div>
          <div className="metric">
            <h4>Confidence</h4>
            <div className="metric-value">High</div>
          </div>
          <div className="metric">
            <h4>Stress Level</h4>
            <div className="metric-value">Low</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAnalyzer;
