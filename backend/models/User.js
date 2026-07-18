const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('STUDENT', 'COMPANY', 'ADMIN', 'SUPERVISOR'),
    allowNull: false,
  },
  // Faculty code — used for admin/supervisor search & filter tooling.
  // Applies to STUDENT and SUPERVISOR users; null for COMPANY/ADMIN.
  // Distinct from Student.faculty (a free-text descriptive field).
  faculty: {
    type: DataTypes.ENUM('FCCI (IT)', 'ICAD (Arts)', 'FBM (Business)', 'IMus (Music)'),
    allowNull: true,
  },
  // Soft-delete: deactivated accounts can't log in but data is retained
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Password reset token stored temporarily (would be emailed in production)
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = User;
