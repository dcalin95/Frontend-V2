// 🎯 ROUND DURATION STATUS COMPONENT
// Component pentru afișarea status-ului rundei și recomandărilor

import React, { useState } from 'react';
import axios from 'axios';
import './RoundDurationStatus.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const RoundDurationStatus = ({ presaleState }) => {

  const {
    roundDuration,
    salesAnalysis,
    roundNumber,
    price,
    contractData
  } = presaleState;

  // 🎯 Funcție pentru calculul prețului optim pentru următoarea rundă
  const calculateOptimalPrice = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/presale/calculate-optimal-price`, {
        params: {
          roundNumber: roundNumber + 1,
          tokensAvailable: 20000000 // Exemplu
        }
      });

      const { optimalPrice, estimatedDailySales, estimatedTotalValue } = response.data;
      
      alert(`🎯 Preț optim pentru runda ${roundNumber + 1}:
💰 Preț: $${optimalPrice.toFixed(6)}
📈 Vânzări estimate/zi: ${estimatedDailySales.toFixed(0)} tokens
💵 Valoare totală estimată: $${estimatedTotalValue.toFixed(2)}`);
    } catch (error) {
      alert(`❌ Eroare la calculul prețului optim: ${error.response?.data?.error || error.message}`);
    }
  };

  // 🎯 Funcție pentru calculul prețului optim pentru următoarea rundă
  const calculateOptimalPrice = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/presale/calculate-optimal-price`, {
        params: {
          roundNumber: roundNumber + 1,
          tokensAvailable: 20000000 // Exemplu
        }
      });

      const { optimalPrice, estimatedDailySales, estimatedTotalValue } = response.data;
      
      alert(`🎯 Preț optim pentru runda ${roundNumber + 1}:
💰 Preț: $${optimalPrice.toFixed(6)}
📈 Vânzări estimate/zi: ${estimatedDailySales.toFixed(0)} tokens
💵 Valoare totală estimată: $${estimatedTotalValue.toFixed(2)}`);
    } catch (error) {
      alert(`❌ Eroare la calculul prețului optim: ${error.response?.data?.error || error.message}`);
    }
  };

  // 🎯 Determină culoarea pentru eficiența vânzărilor
  const getSalesEfficiencyColor = (efficiency) => {
    if (efficiency >= 100) return '#00ff00'; // Verde - bun
    if (efficiency >= 80) return '#ffff00'; // Galben - acceptabil
    return '#ff0000'; // Roșu - problematic
  };

  // 🎯 Determină culoarea pentru zilele rămase
  const getDaysRemainingColor = (days) => {
    if (days > 7) return '#00ff00'; // Verde
    if (days > 3) return '#ffff00'; // Galben
    return '#ff0000'; // Roșu
  };

  return (
    <div className="round-duration-status">
      <h3>🎯 Control Durată Rundă</h3>
      
      {/* Status-ul rundei */}
      <div className="round-status-grid">
        <div className="status-card">
          <h4>📅 Durată Rundă</h4>
          <div className="status-item">
            <span>Zile trecute:</span>
            <span className="value">{roundDuration.daysElapsed.toFixed(1)} zile</span>
          </div>
          <div className="status-item">
            <span>Zile rămase:</span>
            <span 
              className="value" 
              style={{ color: getDaysRemainingColor(roundDuration.daysRemaining) }}
            >
              {roundDuration.daysRemaining.toFixed(1)} zile
            </span>
          </div>
          <div className="status-item">
            <span>Progres:</span>
            <span className="value">{roundDuration.progress?.toFixed(1) || 0}%</span>
          </div>
        </div>

        <div className="status-card">
          <h4>📊 Eficiența Vânzărilor</h4>
          <div className="status-item">
            <span>Eficiență:</span>
            <span 
              className="value" 
              style={{ color: getSalesEfficiencyColor(roundDuration.salesEfficiency) }}
            >
              {roundDuration.salesEfficiency.toFixed(1)}%
            </span>
          </div>
          <div className="status-item">
            <span>Rata actuală:</span>
            <span className="value">{salesAnalysis.actualSalesRate.toFixed(0)}/zi</span>
          </div>
          <div className="status-item">
            <span>Rata țintă:</span>
            <span className="value">{salesAnalysis.targetSalesRate.toFixed(0)}/zi</span>
          </div>
        </div>

        <div className="status-card">
          <h4>💰 Analiza Vânzărilor</h4>
          <div className="status-item">
            <span>Preț actual (fix):</span>
            <span className="value">${price.toFixed(6)}</span>
          </div>
          <div className="status-item">
            <span>Rata actuală:</span>
            <span className="value">{salesAnalysis.actualSalesRate.toFixed(0)}/zi</span>
          </div>
          <div className="status-item">
            <span>Rata țintă:</span>
            <span className="value">{salesAnalysis.targetSalesRate.toFixed(0)}/zi</span>
          </div>
        </div>

        {/* 🎯 DATE DIN CONTRACT */}
        {contractData && (
          <div className="status-card">
            <h4>📋 Date din Contract</h4>
            <div className="status-item">
              <span>Cell ID:</span>
              <span className="value">{contractData.cellId}</span>
            </div>
            <div className="status-item">
              <span>Status Cell:</span>
              <span className="value">{contractData.cellState === '0' ? 'Opened' : 'Closed'}</span>
            </div>
            <div className="status-item">
              <span>Preț Standard:</span>
              <span className="value">${(parseInt(contractData.standardPrice) / 1000).toFixed(6)}</span>
            </div>
            <div className="status-item">
              <span>Preț Privilegiat:</span>
              <span className="value">${(parseInt(contractData.privilegedPrice) / 1000).toFixed(6)}</span>
            </div>
            <div className="status-item">
              <span>Vândut în Contract:</span>
              <span className="value">{parseInt(contractData.soldInContract).toLocaleString()}</span>
            </div>
            <div className="status-item">
              <span>Supply în Contract:</span>
              <span className="value">{parseInt(contractData.supplyInContract).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recomandări */}
      {roundDuration.recommendations && roundDuration.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h4>💡 Recomandări</h4>
          {roundDuration.recommendations.map((rec, index) => (
            <div 
              key={index} 
              className={`recommendation ${rec.priority}`}
            >
              <span className="recommendation-icon">
                {rec.type === 'price_increase' ? '📈' : 
                 rec.type === 'price_decrease' ? '📉' : '⚠️'}
              </span>
              <span className="recommendation-message">{rec.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Acțiuni */}
      <div className="actions-section">
        <h4>⚡ Acțiuni Rapide</h4>
        
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={calculateOptimalPrice}
          >
            🧮 Calculează Preț Optim (Următoarea Rundă)
          </button>

          <button
            className="action-btn secondary"
            onClick={() => {
              if (salesAnalysis.recommendation) {
                alert(`💡 Recomandare pentru următoarea rundă:
${salesAnalysis.recommendation.message}
Preț sugerat: $${salesAnalysis.recommendation.suggestedPrice?.toFixed(6) || 'N/A'}`);
              } else {
                alert('✅ Vânzările sunt la nivelul optim. Nu sunt necesare ajustări pentru următoarea rundă.');
              }
            }}
          >
            💡 Vezi Recomandări
          </button>

          <button
            className="action-btn info"
            onClick={() => {
              const daysLeft = roundDuration.daysRemaining;
              alert(`📅 Status Runda Curentă:
Zile rămase: ${daysLeft.toFixed(1)}
Eficiență: ${roundDuration.salesEfficiency.toFixed(1)}%
Progres: ${roundDuration.progress?.toFixed(1) || 0}%

${daysLeft < 3 ? '⚠️ Runda se termină în curând! Pregătiți următoarea rundă.' : '✅ Runda progresează normal.'}`);
            }}
          >
            📊 Status Runda
          </button>

          <button
            className="action-btn secondary"
            onClick={async () => {
              try {
                const response = await axios.get(`${API_URL}/api/presale/contract-price`);
                if (response.data.success) {
                  const contractData = response.data.data;
                  alert(`📋 Date din Contract:
Cell ID: ${contractData.cellId}
Preț Standard: $${contractData.priceUSD.toFixed(6)}
Status: ${contractData.cell.cellState === '0' ? 'Opened' : 'Closed'}
Vândut: ${parseInt(contractData.cell.sold).toLocaleString()}
Supply: ${parseInt(contractData.cell.supply).toLocaleString()}
Remaining: ${parseInt(contractData.cell.remaining).toLocaleString()}

✅ Datele au fost actualizate din contract!`);
                  // Reîncarcă pagina pentru a actualiza datele
                  window.location.reload();
                }
              } catch (error) {
                alert(`❌ Eroare la actualizarea din contract: ${error.message}`);
              }
            }}
          >
            🔄 Actualizează din Contract
          </button>
        </div>


      </div>

      {/* Avertismente */}
      {roundDuration.shouldEnd && (
        <div className="warning-section">
          <h4>⚠️ Runda Ar Trebui Să Se Termine</h4>
          <p>
            <strong>Motiv:</strong> {roundDuration.endReason === 'time' ? 'Au trecut 14 zile' : 
                                   roundDuration.endReason === 'sold_out' ? 'S-au vândut toate tokenii' : 
                                   'Vânzările sunt prea lente'}
          </p>
          <p>
            <strong>Acțiune recomandată:</strong> Termină runda și începe următoarea
          </p>
        </div>
      )}
    </div>
  );
};

export default RoundDurationStatus; 