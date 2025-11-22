import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RegisteredUsers.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const RegisteredUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper pentru steaguri
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode === 'GL') return '🌐';
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt()));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // TODO: În backend trebuie implementat endpoint-ul GET /api/auth/users
        // Momentan folosim date mock pentru demonstrație dacă serverul dă eroare
        const res = await axios.get(`${API_URL}/api/auth/users`);
        setUsers(res.data.users);
        setLoading(false);
      } catch (err) {
        console.warn("Could not fetch users from backend, showing mock data for demo.");
        
        // MOCK DATA - Pentru a vedea cum va arăta interfața
        setUsers([
          { id: 1, wallet: '0x4CCA...f408', country: 'Romania', countryCode: 'RO', city: 'Bucharest', ip: '86.122.xx.xx', date: '2024-11-22' },
          { id: 2, wallet: '0x7F2B...a912', country: 'Germany', countryCode: 'DE', city: 'Berlin', ip: '45.12.xx.xx', date: '2024-11-21' },
          { id: 3, wallet: '0x19e3...3348', country: 'United States', countryCode: 'US', city: 'New York', ip: '104.22.xx.xx', date: '2024-11-21' },
          { id: 4, wallet: '8u6aW...t4GQ', country: 'France', countryCode: 'FR', city: 'Paris', ip: '92.15.xx.xx', date: '2024-11-20' },
        ]);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="registered-users-container">
      <h2 className="users-title">
        <i className="fas fa-users"></i> Registered Users & Locations
      </h2>
      
      {loading ? (
        <div className="loading-users">Loading user data...</div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Wallet / User</th>
                <th>Location</th>
                <th>IP Address</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id || index}>
                  <td>{index + 1}</td>
                  <td className="wallet-col">
                    <span className="user-icon">👤</span>
                    {user.wallet}
                  </td>
                  <td className="location-col">
                    <span className="flag-icon">{getFlagEmoji(user.countryCode)}</span>
                    <div className="loc-details">
                      <span className="loc-country">{user.country}</span>
                      <span className="loc-city">{user.city}</span>
                    </div>
                  </td>
                  <td className="ip-col">{user.ip}</td>
                  <td>{user.date}</td>
                  <td><span className="status-badge online">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RegisteredUsers;

