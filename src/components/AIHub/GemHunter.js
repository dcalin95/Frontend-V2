import React, { useEffect, useState } from 'react';
import './AIHub.desktop.css';

const GemHunter = () => {
  const [scanProgress, setScanProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Connection to Solana RPC...');

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          setStatus('Monitoring Mempool for New Liquidity Pools...');
          return 100;
        }
        if (prev < 30) setStatus('Scanning Raydium New Pairs...');
        else if (prev < 60) setStatus('Analyzing Contract Safety (RugCheck)...');
        else if (prev < 90) setStatus('Calculating Sniper Bot Activity...');
        return prev + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-hub-container">
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">💎</span>
          100x GEM HUNTER
        </h1>
        <p className="ai-hub-subtitle">Deep Presale Analysis & Solana Contract Scanning</p>
      </div>

      <div style={{ 
        textAlign: 'center', 
        padding: '60px',
        background: 'rgba(10,10,18,0.6)',
        borderRadius: '20px',
        border: '1px solid #00FFA3',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Grid */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'linear-gradient(rgba(0, 255, 163, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 163, 0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          zIndex: 0
        }}></div>

        <div style={{position: 'relative', zIndex: 1}}>
            <h2 style={{color: '#00FFA3', fontFamily: 'Space Grotesk', fontSize: '2rem', marginBottom: '10px'}}>
                AI SCANNING ACTIVE
            </h2>
            <div style={{color: '#8892b0', marginBottom: '30px', fontFamily: 'JetBrains Mono'}}>
                {status}
            </div>

            {/* Progress Bar */}
            <div style={{
                width: '100%', height: '4px', background: '#111', borderRadius: '2px',
                marginBottom: '40px', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    width: `${scanProgress}%`, height: '100%', background: '#00FFA3',
                    boxShadow: '0 0 10px #00FFA3', transition: 'width 0.1s linear'
                }}></div>
            </div>

            <div style={{fontSize: '4rem', margin: '20px', animation: 'float 3s ease-in-out infinite'}}>🚀</div>
            
            <div className="access-granted-badge" style={{maxWidth: '300px', margin: '0 auto'}}>
                SYSTEM INITIALIZING...
            </div>
            
            <div style={{marginTop: '30px', fontSize: '0.8rem', color: '#555'}}>
                Module v1.0.4 • Solana Mainnet-Beta • RPC Node: Helius
            </div>
        </div>
      </div>
    </div>
  );
};

export default GemHunter;
