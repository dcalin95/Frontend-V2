import React, { useState, useEffect, useRef } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import { sendBitsToTreasury } from '../../utils/paymentService';
import './AIHub.desktop.css';
import './LieDetector.css';

const LieDetector = () => {
  const { walletAddress, signer } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(walletAddress);
  
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [metrics, setMetrics] = useState({
    jitter: 0, 
    shimmer: 0, 
    pitch: 0, 
    stress: 0
  });
  const [calibrationStatus, setCalibrationStatus] = useState('IDLE'); 
  const [micVolume, setMicVolume] = useState(0); // New: For VU Meter
  const [errorMessage, setErrorMessage] = useState(null);

  // Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const analysisBuffer = useRef([]);
  const baselineMetrics = useRef({ avgPitch: 0, avgVolume: 0 });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (microphoneRef.current) microphoneRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const startRecording = async () => {
    setErrorMessage(null);
    
    // 1. Payment Check
    if (bitsBalance < AI_TOOLS_PRICING.lieDetector.cost) {
      alert(`Insufficient BITS! You need ${AI_TOOLS_PRICING.lieDetector.cost} BITS.`);
      return;
    }

    try {
      // Check Audio Context Support
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        setErrorMessage("Browser does not support Web Audio API.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      
      // Fix for suspended state in some browsers
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.5; 
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Filter to isolate voice frequencies
      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
      
      microphoneRef.current.connect(filter);
      filter.connect(analyserRef.current);
      
      // Reset State
      setIsRecording(true);
      setVerdict(null);
      setMetrics({ jitter: 0, shimmer: 0, pitch: 0, stress: 0 });
      setMicVolume(0);
      setCalibrationStatus('CALIBRATING');
      analysisBuffer.current = [];
      baselineMetrics.current = { avgPitch: 0, avgVolume: 0 };
      
      drawWaveform();
      analyzeRealTime();
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setErrorMessage("Microphone access denied or not found. Please allow permission.");
    }
  };

  const stopRecording = () => {
    stopRecordingCleanup();
    
    setIsRecording(false);
    setIsAnalyzing(true);
    setCalibrationStatus('IDLE');
    setMicVolume(0);
    
    finalizeVerdict();
  };

  // 🎨 Visualizer Logic (Oscilloscope + Spectrum)
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteTimeDomainData(timeData);
      analyserRef.current.getByteFrequencyData(freqData);
      
      // 1. Clear Canvas
      canvasCtx.fillStyle = '#050505';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Spectrum Background
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barX = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = freqData[i] / 1.5;
        
        const r = barHeight + (25 * (i/bufferLength));
        const g = 250 * (i/bufferLength);
        const b = 50;
        
        canvasCtx.fillStyle = `rgba(${r},${g},${b}, 0.15)`;
        canvasCtx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
        
        barX += barWidth + 1;
        if(barX > canvas.width) break;
      }

      // 3. Waveform Foreground
      canvasCtx.lineWidth = 2;
      
      const currentStress = metrics.stress;
      if (currentStress > 65) {
        canvasCtx.strokeStyle = '#FF3333'; 
        canvasCtx.shadowColor = '#FF3333';
        canvasCtx.shadowBlur = 10;
      } else if (currentStress > 40) {
        canvasCtx.strokeStyle = '#FFAA00'; 
        canvasCtx.shadowColor = '#FFAA00';
        canvasCtx.shadowBlur = 8;
      } else {
        canvasCtx.strokeStyle = '#00FFA3'; 
        canvasCtx.shadowColor = '#00FFA3';
        canvasCtx.shadowBlur = 5;
      }
      
      canvasCtx.beginPath();
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      // 4. REC Indicator
      const centerX = canvas.width - 40;
      const centerY = 40;
      
      if (calibrationStatus === 'CALIBRATING') {
         // Blinking Yellow for Calibration
         canvasCtx.fillStyle = `rgba(255, 170, 0, ${Math.abs(Math.sin(Date.now() / 300))})`;
         canvasCtx.font = "14px JetBrains Mono";
         canvasCtx.fillText("CALIBRATING...", centerX - 80, centerY);
      } else {
         // Pulsing Red for Recording
         canvasCtx.beginPath();
         canvasCtx.arc(centerX, centerY, 8 + (Math.sin(Date.now() / 200) * 3), 0, 2 * Math.PI);
         canvasCtx.fillStyle = 'rgba(255, 51, 51, 0.8)';
         canvasCtx.fill();
         
         canvasCtx.font = "12px JetBrains Mono";
         canvasCtx.fillStyle = "#FF3333";
         canvasCtx.fillText("REC", centerX - 12, centerY + 25);
      }
    };
    
    draw();
  };

  // 🧠 REAL-TIME FORENSIC ANALYSIS ENGINE (VSA Logic v3.0 - Advanced)
  const analyzeRealTime = () => {
    const startTime = Date.now();
    let previousPitch = 0;
    
    const interval = setInterval(() => {
      if (!isRecording || !analyserRef.current) {
        clearInterval(interval);
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(frequencyData);

      // 1. Calculate Volume (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += frequencyData[i] * frequencyData[i];
      const rms = Math.sqrt(sum / bufferLength);
      const volume = rms; // Use RMS for better loudness representation
      
      setMicVolume(volume / 128.0); // Normalize for VU Meter

      // 2. Pitch Calculation (Simple Peak Detection)
      let maxVal = 0;
      let maxIndex = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (frequencyData[i] > maxVal) {
          maxVal = frequencyData[i];
          maxIndex = i;
        }
      }
      const pitch = maxIndex * (audioContextRef.current.sampleRate / 2) / bufferLength;

      // 3. Calibration Phase (Adaptive)
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 2500) {
        setCalibrationStatus('CALIBRATING');
        // Accumulate baseline using Weighted Moving Average
        baselineMetrics.current.avgPitch = (baselineMetrics.current.avgPitch * 0.9) + (pitch * 0.1);
        baselineMetrics.current.avgVolume = (baselineMetrics.current.avgVolume * 0.9) + (volume * 0.1);
        previousPitch = pitch;
        return; 
      } else {
        setCalibrationStatus('READY');
      }

      // 4. ADVANCED VSA Logic
      // Only analyze if volume is above Noise Floor (15)
      if (volume > 15) {
        // A. Jitter Calculation (Cycle-to-Cycle Variation)
        // This detects the chaotic micro-tremors, not just pitch rise
        const instantJitter = Math.abs(pitch - previousPitch);
        const normalizedJitter = Math.min((instantJitter / 20) * 100, 100); // Sensitivity tuned

        // B. Baseline Deviation
        const pitchDeviation = Math.abs(pitch - baselineMetrics.current.avgPitch);
        const volDeviation = Math.abs(volume - baselineMetrics.current.avgVolume);

        // C. Stress Score Calculation (Weighted)
        let stressScore = 0;
        
        // Factor 1: Micro-Tremors (Jitter) - Most critical for lie detection (50% weight)
        stressScore += (normalizedJitter * 0.5);
        
        // Factor 2: Pitch Rise (Tension) - (30% weight)
        // Only penalize if pitch is significantly HIGHER than baseline
        if (pitch > baselineMetrics.current.avgPitch * 1.1) {
           stressScore += Math.min((pitchDeviation / 50) * 30, 30);
        }
        
        // Factor 3: Volume Stress (Shimmer/Loudness) - (20% weight)
        stressScore += Math.min((volDeviation / 20) * 20, 20);

        // D. Smoothing
        // Prevent single-frame spikes from skewing results
        stressScore = Math.min(stressScore, 100);

        // Buffer
        analysisBuffer.current.push({ stress: stressScore, pitch, volume, jitter: normalizedJitter });

        // UI Update
        setMetrics(prev => ({
          shimmer: Math.min(volDeviation * 2, 100), 
          pitch: Math.round(pitch),
          jitter: normalizedJitter,
          stress: Math.round(stressScore)
        }));

        // Adaptive Baseline Update (Slowly drift baseline to account for natural speech changes)
        baselineMetrics.current.avgPitch = (baselineMetrics.current.avgPitch * 0.99) + (pitch * 0.01);

        previousPitch = pitch;

      } else {
        // Silence - Decay stress display quickly
        setMetrics(prev => ({ 
            ...prev, 
            stress: Math.max(0, prev.stress - 10),
            jitter: 0
        }));
      }

    }, 100);
  };

  const finalizeVerdict = () => {
    setTimeout(() => {
      const buffer = analysisBuffer.current;
      
      // Fallback if mostly silence
      if (buffer.length < 10) { 
        setVerdict('UNCERTAIN');
        setErrorMessage("Insufficient audio data. Please speak clearer or closer to mic.");
        setIsAnalyzing(false);
        return;
      }

      const highStressFrames = buffer.filter(f => f.stress > 60).length;
      const mediumStressFrames = buffer.filter(f => f.stress > 40).length;
      const totalFrames = buffer.length;

      const stressRatio = ((highStressFrames * 1.5) + mediumStressFrames) / totalFrames;

      if (stressRatio > 0.3) setVerdict('DECEPTION');
      else if (stressRatio < 0.15) setVerdict('TRUTH');
      else setVerdict('UNCERTAIN');

      setIsAnalyzing(false);
    }, 2000);
  };

  // Export functions remain same...
  const handleEmailReport = () => { /* ... */ };
  const handleDownloadLog = () => { /* ... */ };

  return (
    <div className="ai-hub-container lie-detector-container">
      
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">🎙️</span>
          VSA-9000 LIE DETECTOR
        </h1>
        <p className="ai-hub-subtitle">Voice Stress Analysis & Forensic Bio-Acoustics</p>
      </div>

      {errorMessage && (
        <div style={{background: 'rgba(255, 50, 50, 0.2)', border: '1px solid #ff3333', color: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '10px', textAlign: 'center'}}>
          <i className="fas fa-exclamation-triangle"></i> {errorMessage}
        </div>
      )}

      <div className="monitor-wrapper" style={{position: 'relative'}}>
        
        {/* VU METER (Left Side) */}
        <div className="vu-meter-container">
           <div className="vu-meter-bar" style={{height: `${Math.min(micVolume * 2, 100)}%`}}></div>
        </div>

        <div className="monitor-screen">
          <div className="monitor-grid"></div>
          
          <div className="monitor-status">
            <span className={`status-badge ${isRecording ? 'live' : 'standby'}`}>
              {isRecording ? '● MIC ACTIVE' : '○ STANDBY'}
            </span>
            <span className={`status-badge ${calibrationStatus === 'CALIBRATING' ? 'live' : ''}`}>
              {calibrationStatus === 'CALIBRATING' ? '⚠ CALIBRATING...' : '✓ SYSTEM READY'}
            </span>
          </div>

          {isAnalyzing ? (
            <div className="analyzing-overlay">
              <div className="spinner"></div>
              <div style={{marginTop: '10px', color: '#00FFA3'}}>PROCESSING FORENSIC DATA...</div>
            </div>
          ) : (
            <canvas ref={canvasRef} className="waveform-canvas" width="800" height="300"></canvas>
          )}
        </div>
      </div>

      {/* CONTROLS & METRICS */}
      <div className="control-panel">
        
        <div className="metrics-panel">
          <h4 style={{marginTop: 0, color: '#666'}}>REAL-TIME TELEMETRY</h4>
          <div className="metric-row">
            <span>Vocal Jitter</span>
            <span className={`metric-val ${metrics.jitter > 50 ? 'high' : 'low'}`}>
              {metrics.jitter.toFixed(1)}%
            </span>
          </div>
          <div className="metric-row">
            <span>Pitch (Hz)</span>
            <span className="metric-val">{metrics.pitch} Hz</span>
          </div>
          <div className="metric-row" style={{border: 'none'}}>
            <span>STRESS INDEX</span>
            <span className={`metric-val ${metrics.stress > 60 ? 'high' : 'low'}`}>
              {metrics.stress.toFixed(0)}/100
            </span>
          </div>
        </div>

        <div className="action-panel">
          <button 
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
          >
            <div className="mic-icon">
              <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
            </div>
          </button>
          <div style={{textAlign: 'center', color: '#666', fontSize: '0.8rem'}}>
            {isRecording 
              ? (calibrationStatus === 'CALIBRATING' ? 'Calibrating... Say something...' : 'Recording... Analysis Active') 
              : 'Tap to Record (Speak Clearly)'}
          </div>
        </div>

        <div className="verdict-panel">
          <div className="verdict-title">VERDICT</div>
          {verdict ? (
             <div className={`verdict-result ${verdict.toLowerCase()}`}>{verdict}</div>
          ) : (
             <div className="verdict-result" style={{color: '#333'}}>---</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LieDetector;
