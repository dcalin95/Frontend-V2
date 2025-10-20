import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TransactionHistory.css";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/transactions");
        setTransactions(response.data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="transaction-history-container">
      <h2 className="transaction-history-title">Transaction History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((tx) => (
            <li key={tx.id} className="transaction-item">
              <p><strong>Wallet:</strong> {tx.wallet_address}</p>
              <p><strong>Amount:</strong> {tx.amount} $BITS</p>
              <p><strong>Type:</strong> {tx.type}</p>
              <p><strong>Date:</strong> {new Date(tx.date).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;

