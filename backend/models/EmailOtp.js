const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Pre-registration email verification. Kept separate from User because at
// this point the User doesn't exist yet — this table only ever holds a
// short-lived record while someone is mid-registration.
const EmailOtp = sequelize.define('EmailOtp', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = EmailOtp;
