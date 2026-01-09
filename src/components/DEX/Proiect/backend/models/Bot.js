/**
 * 🤖 Bot Model - Database Model pentru Bots
 * 
 * Sequelize model pentru bots table:
 * - Store bot instances
 * - Track bot status
 * - Manage bot configurations
 * 
 * @module Bot
 */

const { DataTypes } = require('sequelize');

const Bot = (sequelize) => {
  return sequelize.define('Bot', {
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
    botId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      index: true
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('running', 'stopped', 'error'),
      allowNull: false,
      defaultValue: 'stopped',
      index: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    stoppedAt: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'bots',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['botId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });
};

module.exports = Bot;

