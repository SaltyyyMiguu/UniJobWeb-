const { Op } = require('sequelize');
const { Company, JobPosting, Application, Student, User, ChatRoom, Message, sequelize } = require('../models');
const multer = require('multer');
const path = require('path');
const cache = require('../utils/cache');
const { sendStudentEmail } = require('../utils/mailer');

// ─── Multer: company profile image ───────────────────────────────────────────
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
  filename: (req, file, cb) => {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'company-' + u + path.extname(file.originalname));
  }
});
const uploadProfileImageMulter = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'), false);
  },
  limits: { fileSize: 3 * 1024 * 1024 }
});

// ─── Multer: job listing images ───────────────────────────────────────────────
const listingImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/listings/'),
  filename: (req, file, cb) => {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'listing-' + u + path.extname(file.originalname));
  }
});
const uploadListingImageMulter = multer({
  storage: listingImageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ─── Multer: offer letter PDFs ────────────────────────────────────────────────
// Extension is hardcoded to .pdf regardless of the client-supplied originalname —
// never trust an attacker-controlled filename for the extension that express.static
// will use to infer Content-Type when serving the stored file.
const offerLetterStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/offers/'),
  filename: (req, file, cb) => {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'offer-' + u + '.pdf');
  }
});
const uploadOfferLetterMulter = multer({
  storage: offerLetterStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' && ext === '.pdf') cb(null, true);
    else cb(new Error('PDF only'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ─── GET /api/company/profile ─────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });
    res.json(company);
  } catch (error) {
    console.error('[Failed to fetch profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/company/profile ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });
    const { companyName, industry, description, website, address, companySize, foundedYear, phone, linkedinUrl } = req.body;
    if (companyName !== undefined) company.companyName = companyName;
    if (industry !== undefined) company.industry = industry;
    if (description !== undefined) company.description = description;
    if (website !== undefined) company.website = website;
    if (address !== undefined) company.address = address;
    if (companySize !== undefined) company.companySize = companySize;
    if (foundedYear !== undefined) company.foundedYear = foundedYear;
    if (phone !== undefined) company.phone = phone;
    if (linkedinUrl !== undefined) company.linkedinUrl = linkedinUrl;
    await company.save();
    res.json({ message: 'Profile updated successfully.', company });
  } catch (error) {
    console.error('[Failed to update profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/dashboard ───────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });

    const activeJobs = await JobPosting.count({ where: { companyId: company.id, isActive: true } });
    const totalApplications = await Application.count({
      include: [{ model: JobPosting, where: { companyId: company.id } }]
    });
    const pending = await Application.count({
      where: { status: 'PENDING' },
      include: [{ model: JobPosting, where: { companyId: company.id } }]
    });
    const hired = await Application.count({
      where: { status: 'HIRED' },
      include: [{ model: JobPosting, where: { companyId: company.id } }]
    });

    res.json({ company, stats: { activeJobs, totalApplications, pending, hired } });
  } catch (error) {
    console.error('[Failed to fetch dashboard.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/company/jobs ───────────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });
    if (!company.isVerified) return res.status(403).json({ message: 'Company is not verified. Cannot post jobs.' });

    const { title, description, category, location, allowance, requirements, benefits, duration, positionsLeft } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required.' });
    }
    const job = await JobPosting.create({
      companyId: company.id, title, description, category, location,
      allowance, requirements, benefits, duration,
      positionsLeft: positionsLeft || 1,
    });
    cache.del('featured_jobs'); // invalidate dashboard cache
    res.status(201).json({ message: 'Job posted successfully.', job });
  } catch (error) {
    console.error('[Failed to create job.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/company/jobs/:id ────────────────────────────────────────────────
const updateJob = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });
    const job = await JobPosting.findOne({ where: { id: req.params.id, companyId: company.id } });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const { title, description, category, location, allowance, requirements, benefits, duration, positionsLeft, isActive } = req.body;
    if (title) job.title = title;
    if (description) job.description = description;
    if (category) job.category = category;
    if (location !== undefined) job.location = location;
    if (allowance !== undefined) job.allowance = allowance;
    if (requirements !== undefined) job.requirements = requirements;
    if (benefits !== undefined) job.benefits = benefits;
    if (duration !== undefined) job.duration = duration;
    if (positionsLeft !== undefined) job.positionsLeft = positionsLeft;
    if (isActive !== undefined) job.isActive = isActive;
    await job.save();
    cache.del('featured_jobs'); // invalidate dashboard cache
    res.json({ message: 'Job updated.', job });
  } catch (error) {
    console.error('[Failed to update job.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/jobs ────────────────────────────────────────────────────
// Returns only non-archived (active) jobs, annotated with each job's active
// applicant count (PENDING/ACCEPTED/OFFERED) so Manage Jobs can show
// "View Applicants (N)" without a second round-trip.
const getMyJobs = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });
    const jobs = await JobPosting.findAll({
      where: {
        companyId: company.id,
        isArchived: false,
        positionsLeft: { [Op.gt]: 0 } // Safety net: exclude legacy jobs with positionsLeft <= 0
      },
      order: [['createdAt', 'DESC']]
    });

    const jobIds = jobs.map(j => j.id);
    const counts = jobIds.length
      ? await Application.findAll({
          attributes: ['jobId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          where: { jobId: { [Op.in]: jobIds }, status: { [Op.in]: ['PENDING', 'ACCEPTED', 'OFFERED'] } },
          group: ['jobId'],
          raw: true,
        })
      : [];
    const countMap = Object.fromEntries(counts.map(c => [c.jobId, parseInt(c.count, 10)]));

    const jobsWithCounts = jobs.map(j => ({ ...j.toJSON(), applicationCount: countMap[j.id] || 0 }));
    res.json(jobsWithCounts);
  } catch (error) {
    console.error('[Failed to fetch jobs.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── DELETE /api/company/jobs/:id ─────────────────────────────────────────────
// Soft-delete: sets isArchived = true so historical application data is preserved
const deleteJob = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    const job = await JobPosting.findOne({ where: { id: req.params.id, companyId: company.id } });
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    job.isArchived = true;
    job.isActive = false;
    await job.save();
    cache.del('featured_jobs'); // invalidate dashboard cache
    res.json({ message: 'Job archived.' });
  } catch (error) {
    console.error('[Failed to archive job.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── DELETE /api/company/jobs/:id/permanent ──────────────────────────────────
// Hard-delete: only permitted when the job has zero applications of any kind
// (active or closed) — otherwise it would silently erase applicant/audit
// history. Companies with any application history must use the archive
// (soft-delete) endpoint above instead.
const hardDeleteJob = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    const job = await JobPosting.findOne({ where: { id: req.params.id, companyId: company.id } });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const applicationCount = await Application.count({ where: { jobId: job.id } });
    if (applicationCount > 0) {
      return res.status(400).json({ message: 'Cannot permanently delete a job that has applicant history. Please use the Archive function instead.' });
    }

    await job.destroy();
    cache.del('featured_jobs');
    res.json({ message: 'Job permanently deleted.' });
  } catch (error) {
    console.error('[Failed to permanently delete job.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/jobs/archived ──────────────────────────────────────────
const getArchivedJobs = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const jobs = await JobPosting.findAll({
      where: {
        companyId: company.id,
        [Op.or]: [
          { isArchived: true },
          { positionsLeft: { [Op.lte]: 0 } } // Include legacy jobs with no positions left
        ]
      },
      order: [['updatedAt', 'DESC']]
    });
    res.json(jobs);
  } catch (error) {
    console.error('[Failed to fetch archived jobs.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/applications ───────────────────────────────────────────
const getApplications = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });

    const applications = await Application.findAll({
      include: [
        {
          model: JobPosting,
          where: { companyId: company.id },
          attributes: ['id', 'title', 'category', 'positionsLeft']
        },
        {
          model: Student,
          attributes: ['id', 'firstName', 'lastName', 'ucsiId', 'degreeProgram', 'resumeUrl', 'skills', 'profileImageUrl'],
          include: [{ model: User, attributes: ['email'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(applications);
  } catch (error) {
    console.error('[Failed to fetch applications.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/company/applications/:id ───────────────────────────────────────
// Full pipeline: PENDING→ACCEPTED | ACCEPTED→OFFERED | OFFERED→HIRED | any→REJECTED
const updateApplicationStatus = async (req, res) => {
  const { status, offerExpiresInDays } = req.body;

  const VALID_TRANSITIONS = {
    PENDING:  ['ACCEPTED', 'REJECTED'],
    ACCEPTED: ['OFFERED', 'REJECTED'],
    OFFERED:  ['HIRED', 'REJECTED'],
  };

  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    const application = await Application.findOne({
      where: { id: req.params.id },
      include: [
        { model: JobPosting, where: { companyId: company.id } },
        { model: Student, include: [{ model: User, attributes: ['email'] }] },
      ]
    });
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    const allowedNext = VALID_TRANSITIONS[application.status];
    if (!allowedNext || !allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Cannot move from ${application.status} to ${status}.`,
      });
    }

    // Shared by every branch below — fires the student notification email
    // without awaiting it, so a slow/failing SMTP server can never delay or
    // break this request. mailer.js also catches internally as defense-in-depth.
    const studentEmail = application.Student?.User?.email;
    const studentName = `${application.Student?.firstName || ''} ${application.Student?.lastName || ''}`.trim();
    const jobTitle = application.JobPosting?.title;
    const notifyStudent = (type) => {
      sendStudentEmail(studentEmail, studentName, company.companyName, jobTitle, type)
        .catch(err => console.error(`[email] sendStudentEmail(${type}) failed:`, err.message));
    };

    // ── ACCEPTED: Invite to interview → open chat room ────────────────────────
    if (status === 'ACCEPTED') {
      application.status = 'ACCEPTED';
      application.studentSeenAt = null; // new update — student hasn't seen this yet
      await application.save();

      // Create chat room when invited to interview
      const existingRoom = await ChatRoom.findOne({
        where: { studentId: application.studentId, companyId: company.id }
      });
      if (!existingRoom) {
        await ChatRoom.create({
          studentId: application.studentId,
          companyId: company.id,
          applicationId: application.id,
        });
      }
      notifyStudent('INTERVIEW');
      return res.json({ message: 'Candidate invited to interview. Chat room opened.', application });
    }

    // ── OFFERED: Extend formal offer with expiry ──────────────────────────────
    if (status === 'OFFERED') {
      const daysUntilExpiry = parseInt(offerExpiresInDays, 10) || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

      application.status = 'OFFERED';
      application.offerExpiresAt = expiresAt;
      application.studentSeenAt = null; // new update — student hasn't seen this yet

      // Attach offer letter if uploaded via separate endpoint
      if (req.file) {
        application.offerLetterUrl = req.file.path.replace(/\\/g, '/');
      }

      await application.save();
      notifyStudent('OFFER');
      return res.json({ message: `Offer extended. Expires in ${daysUntilExpiry} days.`, application });
    }

    // ── HIRED: Use DB transaction — decrement positionsLeft, exclusivity hook ─
    if (status === 'HIRED') {
      const t = await sequelize.transaction();
      try {
        // Re-fetch and lock the Application itself — closes the TOCTOU gap where
        // a double-click or concurrent request could both pass the earlier
        // unlocked status check and both process the same hire.
        const lockedApplication = await Application.findByPk(application.id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedApplication || lockedApplication.status !== 'OFFERED') {
          await t.rollback();
          return res.status(409).json({ message: 'This application has already been processed.' });
        }

        const job = await JobPosting.findByPk(application.jobId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (job.positionsLeft <= 0) {
          await t.rollback();
          return res.status(400).json({ message: 'No positions left for this job. Cannot hire.' });
        }

        lockedApplication.status = 'HIRED';
        lockedApplication.studentSeenAt = null; // new update — student hasn't seen this yet (drives celebration popup)
        await lockedApplication.save({ transaction: t });

        job.positionsLeft -= 1;
        if (job.positionsLeft === 0) {
          job.isActive = false;
          job.isArchived = true;
        }
        await job.save({ transaction: t });

        // Auto-reject all other active applications from this student
        await Application.update(
          { status: 'AUTO_REJECTED', studentSeenAt: null },
          {
            where: {
              studentId: application.studentId,
              id: { [Op.ne]: application.id },
              status: { [Op.in]: ['PENDING', 'ACCEPTED', 'OFFERED'] },
            },
            transaction: t,
          }
        );

        await t.commit();

        return res.json({
          message: 'Candidate hired successfully. Positions decremented.',
          application: lockedApplication,
          positionsLeft: job.positionsLeft,
        });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    // ── REJECTED: Lock chat room if one exists ────────────────────────────────
    if (status === 'REJECTED') {
      application.status = 'REJECTED';
      application.studentSeenAt = null; // new update — student hasn't seen this yet
      await application.save();

      // Lock the chat room between this student and company
      await ChatRoom.update(
        { isLocked: true },
        { where: { studentId: application.studentId, companyId: company.id } }
      );

      notifyStudent('REJECTED');
      return res.json({ message: 'Application rejected.', application });
    }

    res.status(400).json({ message: 'Unhandled status transition.' });
  } catch (error) {
    console.error('[Failed to update application.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/notifications/count ─────────────────────────────────────
// Count of applicants the company hasn't viewed yet (drives the sidebar badge)
const getNewApplicantCount = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.json({ count: 0 });
    const count = await Application.count({
      where: { companySeenAt: null },
      include: [{ model: JobPosting, where: { companyId: company.id }, attributes: [] }],
    });
    res.json({ count });
  } catch (error) {
    console.error('[Failed to fetch notification count.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/company/notifications/mark-seen ────────────────────────────────
const markApplicantsSeen = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const jobIds = (await JobPosting.findAll({ where: { companyId: company.id }, attributes: ['id'] })).map(j => j.id);
    await Application.update(
      { companySeenAt: new Date() },
      { where: { jobId: { [Op.in]: jobIds }, companySeenAt: null } }
    );
    res.json({ message: 'Marked as seen.' });
  } catch (error) {
    console.error('[Failed to mark as seen.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/chats ───────────────────────────────────────────────────
const getMyChats = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company profile not found.' });
    const rooms = await ChatRoom.findAll({
      where: { companyId: company.id },
      include: [{ model: Student, attributes: ['firstName', 'lastName', 'degreeProgram', 'profileImageUrl'] }]
    });

    // Per-room unread count so the conversation list can badge which student sent unread messages
    const roomIds = rooms.map(r => r.id);
    const unreadCounts = roomIds.length
      ? await Message.findAll({
          attributes: ['chatRoomId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          where: { chatRoomId: { [Op.in]: roomIds }, senderUserId: { [Op.ne]: req.user.id }, isRead: false },
          group: ['chatRoomId'],
          raw: true,
        })
      : [];
    const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.chatRoomId, parseInt(u.count, 10)]));

    res.json(rooms.map(r => ({ ...r.toJSON(), unreadCount: unreadMap[r.id] || 0 })));
  } catch (error) {
    console.error('[Failed to fetch chats.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/unread-count ───────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.json({ count: 0 });

    const rooms = await ChatRoom.findAll({ where: { companyId: company.id }, attributes: ['id'] });
    const roomIds = rooms.map(r => r.id);
    if (roomIds.length === 0) return res.json({ count: 0 });

    const count = await Message.count({
      where: {
        chatRoomId: { [Op.in]: roomIds },
        senderUserId: { [Op.ne]: req.user.id },
        isRead: false,
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('[Failed to fetch unread count.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/company/profile-image ─────────────────────────────────────────
const uploadProfileImage = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    company.profileImageUrl = req.file.path.replace(/\\/g, '/');
    await company.save();
    res.json({ message: 'Logo updated.', profileImageUrl: company.profileImageUrl });
  } catch (err) {
    console.error('[Upload failed.] DB error:', err);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/company/jobs/:id/image ────────────────────────────────────────
const uploadJobImage = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const job = await JobPosting.findOne({ where: { id: req.params.id, companyId: company.id } });
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    job.listingImageUrl = req.file.path.replace(/\\/g, '/');
    await job.save();
    res.json({ message: 'Listing image updated.', listingImageUrl: job.listingImageUrl });
  } catch (err) {
    console.error('[Upload failed.] DB error:', err);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/company/applications/:id/interview-slots ──────────────────────
// Company sets up to 3 available interview time slots (ISO date strings)
const setInterviewSlots = async (req, res) => {
  try {
    const { slots } = req.body; // array of ISO strings, max 3
    if (!Array.isArray(slots) || slots.length === 0 || slots.length > 3) {
      return res.status(400).json({ message: 'Provide 1–3 interview time slots.' });
    }

    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    const application = await Application.findOne({
      where: { id: req.params.id },
      include: [{ model: JobPosting, where: { companyId: company.id } }]
    });
    if (!application) return res.status(404).json({ message: 'Application not found.' });
    if (application.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Interview slots can only be set for ACCEPTED applications.' });
    }

    application.interviewSlots = slots;
    application.confirmedSlot = null; // reset if changed
    await application.save();
    res.json({ message: 'Interview slots saved.', application });
  } catch (err) {
    console.error('[Failed to save interview slots.] DB error:', err);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/company/:companyId/public-profile ───────────────────────────────
// Read-only company profile for students to view from Applications page
const getPublicCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.companyId, {
      attributes: { exclude: ['userId'] },
    });
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    res.json(company);
  } catch (error) {
    console.error('[Failed to fetch company profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/company/applications/:id/offer-letter ─────────────────────────
// Attach a PDF offer letter to an application (Phase 2 snapshot)
const uploadOfferLetter = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    const application = await Application.findOne({
      where: { id: req.params.id },
      include: [{ model: JobPosting, where: { companyId: company.id } }]
    });
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    application.offerLetterUrl = req.file.path.replace(/\\/g, '/');
    await application.save();
    res.json({ message: 'Offer letter uploaded.', offerLetterUrl: application.offerLetterUrl });
  } catch (err) {
    console.error('[Upload failed.] DB error:', err);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── DELETE /api/company/account ─────────────────────────────────────────────
const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isArchived = true;
    await user.save();
    res.json({ message: 'Account deactivated.' });
  } catch (error) {
    console.error('[Failed to deactivate account.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = {
  getProfile, updateProfile, getDashboard,
  createJob, updateJob, getMyJobs, deleteJob, hardDeleteJob, getArchivedJobs,
  getApplications, updateApplicationStatus,
  setInterviewSlots,
  getMyChats, getUnreadCount,
  getNewApplicantCount, markApplicantsSeen,
  getPublicCompanyProfile,
  uploadProfileImage, uploadProfileImageMulter,
  uploadJobImage, uploadListingImageMulter,
  uploadOfferLetter, uploadOfferLetterMulter,
  deactivateAccount,
};
