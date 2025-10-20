import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

const AIPortfolioBuilderModern = React.lazy(() => import('../ai-portfolio/AIPortfolioBuilderModern'));

export default function AIPortfolioPage() {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Modern floating navigation */}
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
            background: 'rgba(0, 0, 0, 0.8)', 
            color: '#00D4FF', 
            border: '1px solid rgba(0, 212, 255, 0.3)', 
            borderRadius: '12px', 
            padding: '12px 20px', 
            cursor: 'pointer',
            backdropFilter: 'blur(20px)',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 212, 255, 0.1)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 25px rgba(0, 212, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.8)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
          }}
        >
          ← Back to Home
        </button>
        <button 
          type="button" 
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} 
          style={{ 
            background: 'rgba(0, 0, 0, 0.8)', 
            color: '#FF6B9D', 
            border: '1px solid rgba(255, 107, 157, 0.3)', 
            borderRadius: '12px', 
            padding: '12px 20px', 
            cursor: 'pointer',
            backdropFilter: 'blur(20px)',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 107, 157, 0.1)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 25px rgba(255, 107, 157, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.8)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
          }}
        >
          ✕ Close
        </button>
      </div>
      
      {/* Modern loading animation */}
      <Suspense fallback={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
          color: '#ffffff'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(0, 212, 255, 0.2)',
            borderTop: '3px solid #00D4FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            background: 'linear-gradient(45deg, #00D4FF, #7B68EE, #FF6B9D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Loading AI Portfolio Builder...
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }>
        <AIPortfolioBuilderModern />
      </Suspense>
    </div>
  );
}


