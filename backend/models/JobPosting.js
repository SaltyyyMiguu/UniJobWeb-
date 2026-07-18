const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobPosting = sequelize.define('JobPosting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Soft-delete: archived jobs are hidden but data is retained for history
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  benefits: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  allowance: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  positionsLeft: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  listingImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = JobPosting;
