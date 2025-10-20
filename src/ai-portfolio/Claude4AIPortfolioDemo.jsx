import React from 'react';
import Claude4AIPortfolioQuantumIntelligence from './Claude4AIPortfolioQuantumIntelligence';
import './Claude4QuantumStyles.css';

/**
 * Demo page for Claude 4 AI Portfolio Quantum Intelligence
 * Uses the existing wallet context from the main app
 */
export default function Claude4AIPortfolioDemo() {
  return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A1A 0%, #050510 100%)',
        padding: '0',
        margin: '0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0'
        }}>
          <header style={{
            textAlign: 'center',
            padding: '40px 20px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
            marginBottom: '0'
          }}>
            <h1 style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #00D4FF 0%, #7B68EE 50%, #FF6B9D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0',
              fontWeight: '700',
              letterSpacing: '-2px'
            }}>
              Claude 4 AI Portfolio Demo
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '15px 0 0 0',
              fontWeight: '400'
            }}>
              Neural Analytics & Quantum Intelligence Portfolio Generator
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '25px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                color: '#00D4FF'
              }}>
                🧠 Neural Networks Active
              </div>
              <div style={{
                background: 'rgba(123, 104, 238, 0.1)',
                border: '1px solid rgba(123, 104, 238, 0.3)',
                borderRadius: '25px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                color: '#7B68EE'
              }}>
                ⚛️ Quantum Computing Enabled
              </div>
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '25px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                color: '#00FF88'
              }}>
                🔗 Blockchain Integration Ready
              </div>
            </div>
          </header>
          
          <Claude4AIPortfolioQuantumIntelligence />
          
          <footer style={{
            textAlign: 'center',
            padding: '60px 20px 40px 20px',
            borderTop: '1px solid rgba(0, 212, 255, 0.2)',
            marginTop: '60px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '30px',
              marginBottom: '40px'
            }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  color: '#00D4FF',
                  margin: '0 0 15px 0',
                  fontSize: '1.2rem'
                }}>
                  🧠 Neural Analytics
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}>
                  Advanced machine learning algorithms analyze market patterns, risk correlations, and optimize asset allocations using deep neural networks.
                </p>
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(123, 104, 238, 0.2)',
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  color: '#7B68EE',
                  margin: '0 0 15px 0',
                  fontSize: '1.2rem'
                }}>
                  ⚛️ Quantum Intelligence
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}>
                  Quantum-enhanced portfolio optimization leverages superposition principles to evaluate multiple scenarios simultaneously for optimal results.
                </p>
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 255, 136, 0.2)',
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  color: '#00FF88',
                  margin: '0 0 15px 0',
                  fontSize: '1.2rem'
                }}>
                  🔗 Blockchain Integration
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}>
                  Real-time data extraction from Node, CellManager, and AdditionalReward smart contracts for live portfolio analytics.
                </p>
              </div>
            </div>
            
            <div style={{
              marginTop: '40px',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <p style={{ margin: '5px 0' }}>
                🧠 Powered by Claude 4 Sonnet • ⚛️ Quantum Enhanced • 🔗 Blockchain Integrated
              </p>
              <p style={{ margin: '5px 0' }}>
                Built with React, Ethers.js, and advanced AI algorithms
              </p>
            </div>
          </footer>
        </div>
      </div>
  );
}
