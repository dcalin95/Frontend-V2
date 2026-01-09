/**
 * 📊 Strategy Model - Database Model pentru Strategies
 * 
 * Sequelize model pentru strategies table:
 * - Store user strategies
 * - Track strategy configurations
 * - Analyze strategy performance
 * 
 * @module Strategy
 */

const { DataTypes } = require('sequelize');

const Strategy = (sequelize) => {
  return sequelize.define('Strategy', {
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('trend-following', 'mean-reversion', 'arbitrage', 'volume-analysis', 'market-making'),
      allowNull: false,
      index: true
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      index: true
    },
    riskLevel: {
      type: DataTypes.ENUM('conservative', 'balanced', 'aggressive'),
      allowNull: false,
      defaultValue: 'balanced'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'strategies',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['enabled'] },
      { fields: ['createdAt'] }
    ]
  });
};

module.exports = Strategy;

