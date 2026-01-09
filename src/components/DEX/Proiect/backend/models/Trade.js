/**
 * 💼 Trade Model - Database Model pentru Trades
 * 
 * Sequelize model pentru trades table:
 * - Store executed trades
 * - Track performance
 * - Historical data pentru analysis
 * 
 * @module Trade
 */

// TODO: Implementare completă
// 1. Import Sequelize
// 2. Define model schema
// 3. Define associations
// 4. Define methods

const { DataTypes } = require('sequelize');

const Trade = (sequelize) => {
  return sequelize.define('Trade', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true
    },
    signalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Signals',
        key: 'id'
      }
    },
    tokenIn: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    tokenOut: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    amountIn: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    amountOut: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    entryPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    exitPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    stopLoss: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    takeProfit: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'executed', 'failed', 'closed'),
      allowNull: false,
      defaultValue: 'pending',
      index: true
    },
    pnl: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'trades',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
      { fields: ['tokenIn', 'tokenOut'] }
    ]
  });
};

module.exports = Trade;

