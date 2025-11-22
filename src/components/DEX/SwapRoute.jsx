import React from 'react';
import './DEX.css';

const SwapRoute = ({ fromToken, toToken }) => {
  // Safety check
  if (!fromToken || !toToken) return null;

  const isSpecial = fromToken.id === 'BTC' && toToken.id === 'bBNB';

  let steps = [];

  if (isSpecial) {
    steps = [
      { token: 'BTC', label: 'Native', color: '#F7931A', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
      { token: 'xBTC', label: 'Wrap', color: '#E0E0E0', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
      { token: 'STX', label: 'Stacks', color: '#5546FF', logo: 'https://assets.coingecko.com/coins/images/2069/small/stacks.png' },
      { token: 'bBNB', label: 'BSC', color: '#F0B90B', logo: 'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png' }
    ];
  } else {
    // Dynamic Route for any other pair
    steps = [
      { 
        token: fromToken.symbol, 
        label: 'Pay', 
        color: '#888', 
        logo: fromToken.icon 
      },
      { 
        token: 'ROUTER', 
        label: 'Auto', 
        color: '#00FFA3', 
        // Using a generic "chip" or "lightning" icon for the router node
        logo: 'https://cdn-icons-png.flaticon.com/128/3655/3655566.png' 
      },
      { 
        token: toToken.symbol, 
        label: 'Receive', 
        color: '#888', 
        logo: toToken.icon 
      }
    ];
  }

  return (
    <div className="dex-route-wrapper">
      <div className="dex-route-header">
        <span className="dex-route-title">Smart Route</span>
        <span className="dex-route-badge">Best Price</span>
      </div>
      
      <div className="dex-route-viz-horizontal">
        {/* Animated Line Background - Hidden for compact view or adjusted */}
        
        <div className="dex-route-nodes-horizontal">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
                <div className="dex-route-node-compact">
                  <div 
                    className="dex-node-circle-compact"
                    style={{ 
                      borderColor: step.color, 
                      boxShadow: `0 0 5px ${step.color}40`,
                      background: '#000'
                    }}
                  >
                    <img 
                      src={step.logo} 
                      alt={step.token} 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} 
                    />
                  </div>
                  <div className="dex-node-labels-compact">
                    <span className="dex-node-name-sm">{step.token}</span>
                  </div>
                </div>
                
                {/* Arrow */}
                {index < steps.length - 1 && (
                   <div className="dex-node-arrow-compact">➜</div>
                )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SwapRoute;
