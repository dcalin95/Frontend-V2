/**
 * 📈 Performance Model - Database Model pentru Performance
 * 
 * Sequelize model pentru performance table:
 * - Store performance metrics
 * - Track user performance
 * - Analyze profitability
 * 
 * @module Performance
 */

const { DataTypes } = require('sequelize');

const Performance = (sequelize) => {
  return sequelize.define('Performance', {
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
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },
    totalTrades: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    winningTrades: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    losingTrades: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalProfit: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0
    },
    totalLoss: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0
    },
    winRate: {
      type: DataTypes.DECIMAL(5, 4), // 0-1
      allowNull: true
    },
    profitFactor: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    sharpeRatio: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    maxDrawdown: {
      type: DataTypes.DECIMAL(5, 4), // 0-1
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'performance',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['periodStart'] },
      { fields: ['periodEnd'] },
      { fields: ['createdAt'] }
    ]
  });
};

module.exports = Performance;

