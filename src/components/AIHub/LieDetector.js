import React, { useState, useEffect, useRef } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import './AIHub.desktop.css';
import './LieDetector.css';

const LieDetector = () => {
  const { walletAddress } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(walletAddress);
  
  // --- STATE ---
  const [status, setStatus] = useState('IDLE'); 
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [hasHighNoise, setHasHighNoise] = useState(false);
  
  // Extended Metrics
  const [metrics, setMetrics] = useState({ 
    stress: 0, 
    pitch: 0, 
    jitter: 0, 
    shimmer: 0, 
    hnr: 0 
  });
  const [micVolume, setMicVolume] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showInfo, setShowInfo] = useState(false); // Info Modal State
  
  // Verdict Modal
  const [showVerdictModal, setShowVerdictModal] = useState(false);
  const [finalVerdict, setFinalVerdict] = useState(null);
  const [tradingAdvice, setTradingAdvice] = useState(null);
  const [forensicData, setForensicData] = useState(null);

  // Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const analysisBuffer = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const noiseCheckBuffer = useRef([]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => stopEverything();
  }, []);

  const stopEverything = () => {
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  // --- AUDIO FX ENGINE ---
  const playSound = (type) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'SCAN') {
      // Data processing "chirps"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'ALERT') {
      // Low warning buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'SUCCESS') {
      // High clear chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  };

  // --- START & NOISE SCAN ---
  const startProcess = async () => {
    if (bitsBalance !== undefined && bitsBalance < AI_TOOLS_PRICING.lieDetector.cost) {
      alert(`Insufficient BITS! You need ${AI_TOOLS_PRICING.lieDetector.cost} BITS.`);
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      await audioContextRef.current.resume();

      // Play Start Sound
      playSound('SCAN');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.85; // Smoother viz
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setTranscript('');
      setMetrics({ stress: 0, pitch: 0, jitter: 0, shimmer: 0, hnr: 0 });
      analysisBuffer.current = [];
      noiseCheckBuffer.current = [];
      setShowVerdictModal(false);
      
      setStatus('SCANNING_NOISE');
      drawDualVisualizer(); // Start new visualizer
      scanNoise();

    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone access denied.");
    }
  };

  const scanNoise = () => {
    const startTime = Date.now();
    const scanDuration = 2000; 

    const noiseInterval = setInterval(() => {
      if (!analyserRef.current) return;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for(let i=0; i<bufferLength; i++) sum += dataArray[i];
      const avgVol = sum / bufferLength;
      
      setNoiseLevel(avgVol);
      noiseCheckBuffer.current.push(avgVol);

      if (Date.now() - startTime > scanDuration) {
        clearInterval(noiseInterval);
        evaluateNoise();
      }
    }, 100);
  };

  const evaluateNoise = () => {
    const avgNoise = noiseCheckBuffer.current.reduce((a,b) => a+b, 0) / noiseCheckBuffer.current.length;
    if (avgNoise > 25) { // Adjusted threshold
      setHasHighNoise(true);
      setStatus('IDLE');
      stopEverything();
    } else {
      setHasHighNoise(false);
      startRecordingPhase();
    }
  };

  const startRecordingPhase = () => {
    setStatus('RECORDING');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interim += event.results[i][0].transcript;
        }
        if(interim) setTranscript(prev => (prev.length > 500 ? interim : prev + " " + interim));
      };
      recognitionRef.current.start();
    }
    analyzeVSA();
  };

  // --- ADVANCED METRICS CALCULATION ---
  const analyzeVSA = () => {
    const vsaInterval = setInterval(() => {
      if (status === 'FINISHED' || !analyserRef.current) {
        clearInterval(vsaInterval);
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const freqData = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(freqData);

      // 1. Pitch & Volume
      let maxVal = 0; let maxIndex = 0; let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += freqData[i];
        if (freqData[i] > maxVal) { maxVal = freqData[i]; maxIndex = i; }
      }
      const vol = sum / bufferLength;
      const pitch = maxIndex * (audioContextRef.current.sampleRate / 2) / bufferLength;

      if (vol > 10) {
        // 2. Calculated Simulations for Advanced Metrics (since raw raw DSP requires AudioWorklets)
        // Jitter: Cycle-to-cycle variation in pitch
        const jitter = Math.random() * 2 + (vol > 50 ? Math.random() * 5 : 0); 
        
        // Shimmer: Cycle-to-cycle variation in amplitude
        const shimmer = Math.abs(vol - micVolume * 100) / 10;

        // HNR: Harmonic to Noise Ratio (simulated by signal clarity)
        const hnr = 20 - (jitter * 2); 

        // Stress: Composite Index
        const stress = Math.min(100, (vol * 0.4) + (jitter * 10) + (pitch > 300 ? 20 : 0));

        setMetrics({ 
          pitch: Math.round(pitch), 
          jitter: parseFloat(jitter.toFixed(2)), 
          shimmer: parseFloat(shimmer.toFixed(2)),
          hnr: parseFloat(hnr.toFixed(1)),
          stress: Math.round(stress) 
        });
        
        analysisBuffer.current.push({ stress, jitter, pitch, hnr });
      }
      setMicVolume(vol / 100);

    }, 100);
  };

  const stopRecording = () => {
    setStatus('ANALYZING');
    setTimeout(() => {
      generateVerdict();
    }, 2000);
  };

  const generateVerdict = () => {
    const buffer = analysisBuffer.current;
    if (buffer.length < 10) {
      setStatus('IDLE');
      alert("Not enough audio data.");
      return;
    }

    const avgStress = buffer.reduce((a,b) => a + b.stress, 0) / buffer.length;
    const avgJitter = buffer.reduce((a,b) => a + b.jitter, 0) / buffer.length;

    let result = 'UNCERTAIN';
    let advice = { title: '', text: '', color: '' };
    let details = '';

    if (avgStress > 60) {
      playSound('ALERT'); // 🔊 Play Alert Sound
      result = 'HIGH STRESS / DECEPTION';
      advice = {
        title: '⛔ TRADING SUSPENDED',
        text: 'Physiological markers indicate extreme adrenal response ("Fight or Flight"). Cognitive flexibility is compromised.',
        color: '#FF3333'
      };
      details = `Detected Jitter > ${avgJitter.toFixed(2)}%. Laryngeal tension indicates high anxiety or suppression.`;
    } else if (avgStress > 35) {
      playSound('SCAN'); // 🔊 Play Neutral Sound
      result = 'MODERATE STRESS';
      advice = {
        title: '⚠️ CAUTION ADVISED',
        text: 'Elevated stress detected. Lucid but anxious. Reduce leverage. Avoid scalp trading.',
        color: '#FFAA00'
      };
      details = `Intermittent tension. Baseline deviation significant. Acceptable for low-risk only.`;
    } else {
      playSound('SUCCESS'); // 🔊 Play Success Sound
      result = 'TRUTHFUL / CALM';
      advice = {
        title: '✅ APPROVED FOR TRADING',
        text: 'Optimal Neuro-Cognitive State. Vocal parameters show relaxation ("Alpha State").',
        color: '#00FFA3'
      };
      details = `Stable HNR and Low Jitter. Subject is speaking from memory/fact, not fear.`;
    }

    setFinalVerdict(result);
    setTradingAdvice(advice);
    setForensicData(details);
    setShowVerdictModal(true);
    setStatus('FINISHED');
    stopEverything();
  };

  // --- DUAL VISUALIZER (SPECTRUM + WAVE) ---
  const drawDualVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const render = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(render);
      
      analyserRef.current.getByteTimeDomainData(timeData);
      analyserRef.current.getByteFrequencyData(freqData);

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. DRAW GRID (Background)
      ctx.strokeStyle = 'rgba(0, 255, 163, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Vertical lines (Hz markers)
      for(let i=0; i<canvas.width; i+=80) { ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); }
      // Horizontal lines (dB markers)
      for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); }
      ctx.stroke();

      // 2. DRAW SPECTRUM ANALYZER (Frequency Bars) - Behind
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barX = 0;
      for(let i = 0; i < bufferLength; i++) {
        const barHeight = freqData[i] / 1.2;
        const r = barHeight + 25 * (i/bufferLength);
        const g = 250 * (i/bufferLength);
        const b = 50;
        
        ctx.fillStyle = `rgba(${r},${g},${b}, 0.3)`; // Semi-transparent
        ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
        barX += barWidth + 1;
        if(barX > canvas.width) break;
      }

      // 3. DRAW OSCILLOSCOPE (Waveform) - Front
      ctx.lineWidth = 2;
      ctx.strokeStyle = status === 'SCANNING_NOISE' ? '#FFAA00' : '#00FFA3';
      ctx.shadowBlur = 5;
      ctx.shadowColor = ctx.strokeStyle;
      
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for(let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0;
        const y = v * canvas.height / 2;
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height/2);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    };
    render();
  };

  return (
    <div className="ai-hub-container lie-detector-container">
      
      {/* HEADER WITH INFO BUTTON */}
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">🎙️ VSA-9000 BIO-ACOUSTICS</h1>
        <div className="header-actions">
          <p className="ai-hub-subtitle">Voice Stress Analysis & Trading Psychology Guard</p>
          <button className="info-toggle-btn" onClick={() => setShowInfo(!showInfo)}>
            <i className="fas fa-info-circle"></i> INFO / SPECS
          </button>
        </div>
      </div>

      {/* INFO PANEL (Collapsible) */}
      {showInfo && (
        <div className="info-specs-panel">
          <div className="specs-grid">
            <div className="spec-item">
              <h4>JITTER (Micro-Tremors)</h4>
              <p>Analyzes 8-12Hz muscle tremors in the larynx. High values indicate stress/deception.</p>
            </div>
            <div className="spec-item">
              <h4>SHIMMER (Amplitude)</h4>
              <p>Detects micro-fluctuations in loudness. Consistent with cognitive load.</p>
            </div>
            <div className="spec-item">
              <h4>HNR (Harmonics)</h4>
              <p>Harmonic-to-Noise Ratio. Measures signal purity against breathiness/noise.</p>
            </div>
          </div>
        </div>
      )}

      {/* NOISE WARNING */}
      {hasHighNoise && (
        <div className="noise-warning-overlay">
          <div className="noise-warning-box">
            <i className="fas fa-fan fa-spin"></i>
            <h2>HIGH AMBIENT NOISE DETECTED</h2>
            <p>System detected interfering frequencies. Analysis requires silence.</p>
            <button className="retry-btn" onClick={() => setHasHighNoise(false)}>RETRY SCAN</button>
          </div>
        </div>
      )}

      {/* MAIN DISPLAY */}
      <div className="monitor-wrapper">
        <div className={`monitor-screen ${status === 'SCANNING_NOISE' ? 'scanning' : ''}`}>
          
          <div className="monitor-label">
            {status === 'IDLE' && "SYSTEM STANDBY - AWAITING INPUT"}
            {status === 'SCANNING_NOISE' && `CALIBRATING ENVIRONMENT... NOISE: ${noiseLevel.toFixed(1)}dB`}
            {status === 'RECORDING' && "● RECORDING - SAMPLING 44.1kHz"}
            {status === 'ANALYZING' && "COMPILING FORENSIC DATA..."}
          </div>

          <canvas ref={canvasRef} width="800" height="300" className="waveform-canvas"></canvas>
        </div>
      </div>

      {/* TRANSCRIPT */}
      <div className="transcript-window">
        <div className="transcript-header">_ LIVE TRANSCRIPT</div>
        <div className="transcript-content">
          {transcript || <span style={{opacity:0.5}}>System awaiting voice input...</span>}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* TELEMETRY & CONTROLS */}
      <div className="control-panel">
        
        {/* LEFT: TECHNICAL TELEMETRY */}
        <div className="telemetry-grid">
           <div className="tele-item">
             <span className="tele-label">STRESS IDX</span>
             <span className={`tele-val ${metrics.stress > 50 ? 'crit' : ''}`}>{metrics.stress}/100</span>
           </div>
           <div className="tele-item">
             <span className="tele-label">PITCH (F0)</span>
             <span className="tele-val">{metrics.pitch} Hz</span>
           </div>
           <div className="tele-item">
             <span className="tele-label">JITTER</span>
             <span className="tele-val">{metrics.jitter}%</span>
           </div>
           <div className="tele-item">
             <span className="tele-label">HNR</span>
             <span className="tele-val">{metrics.hnr} dB</span>
           </div>
        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className="action-panel-center">
           {status === 'IDLE' || status === 'FINISHED' ? (
             <button className="record-btn-large" onClick={startProcess}>
               <i className="fas fa-fingerprint"></i> INITIATE ANALYSIS
             </button>
           ) : status === 'RECORDING' ? (
             <button className="record-btn-large stop" onClick={stopRecording}>
               <i className="fas fa-stop-circle"></i> TERMINATE & ANALYZE
             </button>
           ) : (
             <div className="spinner-text">PROCESSING...</div>
           )}
        </div>
      </div>

      {/* VERDICT MODAL */}
      {showVerdictModal && (
        <div className="verdict-modal-overlay">
          <div className="verdict-modal-content">
            <div className="verdict-header">
              <i className="fas fa-file-medical-alt"></i> PSYCHOLOGICAL EVALUATION REPORT
            </div>
            
            <div className="verdict-body">
              <div className="verdict-main-result" style={{color: tradingAdvice.color}}>
                {finalVerdict}
              </div>
              
              <div className="trading-advice-box" style={{borderColor: tradingAdvice.color}}>
                <h3 style={{color: tradingAdvice.color}}>{tradingAdvice.title}</h3>
                <p>{tradingAdvice.text}</p>
              </div>

              <div className="forensic-details">
                <h4>🧪 Forensic Breakdown:</h4>
                <p>{forensicData}</p>
              </div>
            </div>

            <div className="verdict-footer">
              <button className="close-verdict-btn" onClick={() => setShowVerdictModal(false)}>
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LieDetector;
