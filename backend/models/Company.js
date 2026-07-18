const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ssmNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companySize: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  foundedYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Company;
