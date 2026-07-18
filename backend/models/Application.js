const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // Full lifecycle: PENDING → ACCEPTED → OFFERED → HIRED | REJECTED | WITHDRAWN | AUTO_REJECTED
  // Once HIRED, the assigned academic supervisor must approve/reject the placement:
  // HIRED → APPROVED_BY_UNI | REJECTED_BY_UNI
  // Legacy values OFFER_ACCEPTED / OFFER_REJECTED kept for backward-compatible DB rows
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'ACCEPTED',
      'OFFERED',
      'HIRED',
      'REJECTED',
      'WITHDRAWN',
      'AUTO_REJECTED',
      'OFFER_ACCEPTED',
      'OFFER_REJECTED',
      'APPROVED_BY_UNI',
      'REJECTED_BY_UNI'
    ),
    defaultValue: 'PENDING',
  },
  // Snapshot of student's resume URL at time of application
  resumeSnapshot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // URL of the offer letter PDF uploaded by the company
  offerLetterUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // When the OFFERED status expires and becomes AUTO_REJECTED
  offerExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // JSON array of ISO date strings — up to 3 interview time slots set by the company
  interviewSlots: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('interviewSlots');
      try { return raw ? JSON.parse(raw) : []; } catch { return []; }
    },
    set(val) {
      this.setDataValue('interviewSlots', val ? JSON.stringify(val) : null);
    }
  },
  // The one slot confirmed by the student
  confirmedSlot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // null = company hasn't viewed this applicant yet (drives the "new applicant" badge)
  companySeenAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // null = student hasn't seen the current status yet (drives the "update" badge + hired celebration)
  studentSeenAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Application;
