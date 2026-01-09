/**
 * 📡 Signal Model - Database Model pentru Signals
 * 
 * Sequelize model pentru signals table:
 * - Store trading signals
 * - Track signal history
 * - Analyze signal performance
 * 
 * @module Signal
 */

const { DataTypes } = require('sequelize');

const Signal = (sequelize) => {
  return sequelize.define('Signal', {
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
    token: {
      type: DataTypes.STRING(50),
      allowNull: false,
      index: true
    },
    signal: {
      type: DataTypes.ENUM('buy', 'sell', 'hold'),
      allowNull: false,
      index: true
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4), // 0-1
      allowNull: false
    },
    reasoning: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    entryPrice: {
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
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 50
    },
    valid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    validationErrors: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'signals',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['token'] },
      { fields: ['signal'] },
      { fields: ['createdAt'] },
      { fields: ['valid'] }
    ]
  });
};

module.exports = Signal;

