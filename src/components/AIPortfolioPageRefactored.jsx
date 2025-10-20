import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

const AIPortfolioAnalyticsRefactored = React.lazy(() => import('../ai-portfolio/AIPortfolioAnalyticsRefactored'));

export default function AIPortfolioPageRefactored() {
  const navigate = useNavigate();
  
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Enhanced floating navigation */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '20px', 
        right: '20px',
        display: 'flex', 
        justifyContent: 'space-between', 
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          style={{ 
            background: 'rgba(0, 0, 0, 0.9)', 
            color: '#00D4FF', 
            border: '2px solid rgba(0, 212, 255, 0.4)', 
            borderRadius: '15px', 
            padding: '15px 25px', 
            cursor: 'pointer',
            backdropFilter: 'blur(20px)',
            fontWeight: '700',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            fontFamily: 'Inter, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 212, 255, 0.15)';
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 12px 40px rgba(0, 212, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.9)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
          }}
        >
          ← Back to Home
        </button>
        
        <div style={{
          display: 'flex',
          gap: '15px',
          pointerEvents: 'auto'
        }}>
          <button 
            type="button" 
            onClick={() => window.location.reload()} 
            style={{ 
              background: 'rgba(0, 0, 0, 0.9)', 
              color: '#FFD700', 
              border: '2px solid rgba(255, 215, 0, 0.4)', 
              borderRadius: '15px', 
              padding: '15px 20px', 
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
              fontWeight: '700',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 215, 0, 0.15)';
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.9)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
            }}
            title="Refresh AI Analytics"
          >
            🔄 Refresh
          </button>
          
          <button 
            type="button" 
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} 
            style={{ 
              background: 'rgba(0, 0, 0, 0.9)', 
              color: '#FF6B9D', 
              border: '2px solid rgba(255, 107, 157, 0.4)', 
              borderRadius: '15px', 
              padding: '15px 20px', 
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
              fontWeight: '700',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 107, 157, 0.15)';
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 40px rgba(255, 107, 157, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.9)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>
      
      {/* Enhanced loading animation with neural network theme */}
      <Suspense fallback={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif'
        }}>
          {/* Neural network loading animation */}
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            marginBottom: '30px'
          }}>
            {/* Central brain icon */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '3rem',
              animation: 'brain-pulse 2s ease-in-out infinite'
            }}>🧠</div>
            
            {/* Orbiting neurons */}
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '12px',
                  height: '12px',
                  background: `linear-gradient(45deg, ${['#00D4FF', '#7B68EE', '#FF6B9D', '#FFD700'][i]}, ${['#0099CC', '#5A4FCF', '#E91E63', '#FFA000'][i]})`,
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transformOrigin: '6px 60px',
                  animation: `orbit-${i} 3s linear infinite`,
                  boxShadow: `0 0 15px ${['#00D4FF', '#7B68EE', '#FF6B9D', '#FFD700'][i]}`
                }}
              />
            ))}
          </div>
          
          <div style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #00D4FF, #7B68EE, #FF6B9D, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            Initializing AI Portfolio Analytics v2.0
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            Loading advanced neural networks and market analysis algorithms...
          </div>
          
          {/* Progress bar */}
          <div style={{
            width: '300px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            marginTop: '25px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #00D4FF, #7B68EE, #FF6B9D, #FFD700)',
              borderRadius: '2px',
              animation: 'loading-progress 2s ease-in-out infinite'
            }}></div>
          </div>
          
          <style>{`
            @keyframes brain-pulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)); }
              50% { transform: translate(-50%, -50%) scale(1.1); filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)); }
            }
            
            @keyframes orbit-0 {
              0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
              100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
            }
            
            @keyframes orbit-1 {
              0% { transform: rotate(90deg) translateX(60px) rotate(-90deg); }
              100% { transform: rotate(450deg) translateX(60px) rotate(-450deg); }
            }
            
            @keyframes orbit-2 {
              0% { transform: rotate(180deg) translateX(60px) rotate(-180deg); }
              100% { transform: rotate(540deg) translateX(60px) rotate(-540deg); }
            }
            
            @keyframes orbit-3 {
              0% { transform: rotate(270deg) translateX(60px) rotate(-270deg); }
              100% { transform: rotate(630deg) translateX(60px) rotate(-630deg); }
            }
            
            @keyframes loading-progress {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      }>
        <AIPortfolioAnalyticsRefactored />
      </Suspense>
    </div>
  );
}
