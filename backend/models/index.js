const sequelize = require('../config/database');

const User = require('./User');
const Student = require('./Student');
const Company = require('./Company');
const Supervisor = require('./Supervisor');
const JobPosting = require('./JobPosting');
const Application = require('./Application');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');
const EmailOtp = require('./EmailOtp');

// --- Associations ---

// User to Student (1-to-1)
User.hasOne(Student, { foreignKey: 'userId', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId' });

// User to Company (1-to-1)
User.hasOne(Company, { foreignKey: 'userId', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'userId' });

// User to Supervisor (1-to-1)
User.hasOne(Supervisor, { foreignKey: 'userId', onDelete: 'CASCADE' });
Supervisor.belongsTo(User, { foreignKey: 'userId' });

// Supervisor to Student (1-to-Many) — the handshake relationship
Supervisor.hasMany(Student, { as: 'students', foreignKey: 'supervisorId' });
Student.belongsTo(Supervisor, { as: 'supervisor', foreignKey: 'supervisorId' });

// Company to JobPosting (1-to-Many)
Company.hasMany(JobPosting, { foreignKey: 'companyId', onDelete: 'CASCADE' });
JobPosting.belongsTo(Company, { foreignKey: 'companyId' });

// Student to Application (1-to-Many)
Student.hasMany(Application, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Application.belongsTo(Student, { foreignKey: 'studentId' });

// JobPosting to Application (1-to-Many)
JobPosting.hasMany(Application, { foreignKey: 'jobId', onDelete: 'CASCADE' });
Application.belongsTo(JobPosting, { foreignKey: 'jobId' });

// ChatRoom Associations
Student.hasMany(ChatRoom, { foreignKey: 'studentId', onDelete: 'CASCADE' });
ChatRoom.belongsTo(Student, { foreignKey: 'studentId' });

Company.hasMany(ChatRoom, { foreignKey: 'companyId', onDelete: 'CASCADE' });
ChatRoom.belongsTo(Company, { foreignKey: 'companyId' });

// Message Associations
ChatRoom.hasMany(Message, { foreignKey: 'chatRoomId', onDelete: 'CASCADE' });
Message.belongsTo(ChatRoom, { foreignKey: 'chatRoomId' });

User.hasMany(Message, { foreignKey: 'senderUserId', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderUserId' });

module.exports = {
  sequelize,
  User,
  Student,
  Company,
  Supervisor,
  JobPosting,
  Application,
  ChatRoom,
  Message,
  EmailOtp
};
