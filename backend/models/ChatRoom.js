const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // Set to true when the underlying application is REJECTED — freezes chat input
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = ChatRoom;
