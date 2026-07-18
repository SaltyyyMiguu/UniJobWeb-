const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
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
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ucsiId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  degreeProgram: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  faculty: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  skills: {
    type: DataTypes.TEXT, // stored as JSON array string
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
  githubUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  portfolioUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // FK to Supervisor.id (not User.id) — null means no supervisor request has been made yet
  supervisorId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // null = no request made. PENDING = awaiting supervisor response. APPROVED/REJECTED = resolved.
  supervisorStatus: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Student;
