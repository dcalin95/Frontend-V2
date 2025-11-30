import React, { useState, useEffect } from 'react';
import './AdminNeuralLink.css';

const AdminNeuralLink = () => {
  const [visitors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Firebase tracking removed - no data available
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="admin-neural-container">
        <h1 className="admin-neural-title">🧠 ADMIN NEURAL LINK</h1>
        <p className="matrix-text">LOADING VISITOR DATA...</p>
      </div>
    );
  }

  return (
    <div className="admin-neural-container">
      <h1 className="admin-neural-title">🧠 ADMIN NEURAL LINK</h1>
      <p className="admin-neural-subtitle">Real-time Visitor Intelligence Matrix</p>

      <div className="visitor-table-container">
        <table className="visitor-table">
          <thead>
            <tr>
              <th>IP</th>
              <th>Location</th>
              <th>Device</th>
              <th>Browser</th>
              <th>Wallets</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', opacity: 0.5}}>
                  No visitor data available
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.id}>
                  <td>{visitor.ip || 'N/A'}</td>
                  <td>{visitor.location || 'Unknown'}</td>
                  <td>{visitor.os || 'Unknown'}</td>
                  <td>{visitor.browser || 'Unknown'}</td>
                  <td>{visitor.wallets?.join(', ') || 'None'}</td>
                  <td>
                    {visitor.timestamp 
                      ? new Date(visitor.timestamp.seconds * 1000).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminNeuralLink;

