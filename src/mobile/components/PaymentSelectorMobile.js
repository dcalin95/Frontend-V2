import React from "react";

const PaymentSelectorMobile = ({ onSelectMethod }) => {
  return (
    <div className="payment-selector-mobile">
      <h3 style={{
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: 'rgba(255,255,255,0.9)'
      }}>
        Select Payment Method
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Card Payment Option */}
        <button
          onClick={() => onSelectMethod('stripe')}
          style={{
            background: 'linear-gradient(180deg, rgba(99, 91, 255, 0.1) 0%, rgba(99, 91, 255, 0.05) 100%)',
            border: '1px solid rgba(99, 91, 255, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minHeight: '140px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(99, 91, 255, 0.1)'
          }}
        >
          <div style={{
            marginBottom: '15px',
            filter: 'drop-shadow(0 0 15px rgba(99, 91, 255, 0.6))',
            width: '48px',
            height: '48px'
          }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 7h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm0 4h20M6 15h4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '4px'}}>
            Card
          </div>
          <div style={{fontSize: '11px', color: '#a5b4fc'}}>
            Stripe / Bank
          </div>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(99,91,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        </button>

        {/* Crypto Payment Option */}
        <button
          onClick={() => onSelectMethod('crypto')}
          style={{
            background: 'linear-gradient(180deg, rgba(20, 241, 149, 0.1) 0%, rgba(20, 241, 149, 0.05) 100%)',
            border: '1px solid rgba(20, 241, 149, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minHeight: '140px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(20, 241, 149, 0.1)'
          }}
        >
          <div style={{
            marginBottom: '15px',
            filter: 'drop-shadow(0 0 15px rgba(20, 241, 149, 0.6))',
            width: '48px',
            height: '48px'
          }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#14f195" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '4px'}}>
            Crypto
          </div>
          <div style={{fontSize: '11px', color: '#86efac'}}>
            ETH, BNB, SOL...
          </div>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(20,241,149,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        </button>
      </div>
      
      <div style={{marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)'}}>
        Secure payments powered by Web3 & Stripe
      </div>
    </div>
  );
};

export default PaymentSelectorMobile;
