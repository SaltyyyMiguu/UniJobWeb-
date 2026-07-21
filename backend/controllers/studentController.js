const { Op } = require('sequelize');
const { Student, Application, JobPosting, Company, User, ChatRoom, Message, Supervisor, sequelize } = require('../models');
const cache = require('../utils/cache');
const { sendCompanyEmail, sendSupervisorEmail } = require('../utils/mailer');
const { uploadResume: upload, uploadStudentProfileImage: uploadProfileImageMulter } = require('../utils/cloudinaryUploader');

// ─── GET /api/student/profile ─────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    res.json(student);
  } catch (error) {
    console.error('[Failed to fetch profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/student/request-supervisor ────────────────────────────────────
// Only allowed when there's no pending/approved relationship — a null status
// (never requested) or REJECTED (per directive: allow re-selection) may re-request.
const requestSupervisor = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    if (student.supervisorStatus === 'PENDING' || student.supervisorStatus === 'APPROVED') {
      return res.status(400).json({ message: 'You already have an active or pending supervisor request.' });
    }

    const { supervisorId } = req.body;
    const supervisor = await Supervisor.findByPk(supervisorId);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found.' });

    student.supervisorId = supervisorId;
    student.supervisorStatus = 'PENDING';
    await student.save();
    res.json({ message: 'Supervisor request sent.', student });
  } catch (error) {
    console.error('[Failed to request supervisor.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/student/profile ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const { firstName, lastName, faculty, degreeProgram, bio, skills, phone, linkedinUrl, githubUrl, portfolioUrl } = req.body;
    if (firstName !== undefined) student.firstName = firstName;
    if (lastName !== undefined) student.lastName = lastName;
    if (faculty !== undefined) student.faculty = faculty;
    if (degreeProgram !== undefined) student.degreeProgram = degreeProgram;
    if (bio !== undefined) student.bio = bio;
    if (skills !== undefined) student.skills = Array.isArray(skills) ? JSON.stringify(skills) : skills;
    if (phone !== undefined) student.phone = phone;
    if (linkedinUrl !== undefined) student.linkedinUrl = linkedinUrl;
    if (githubUrl !== undefined) student.githubUrl = githubUrl;
    if (portfolioUrl !== undefined) student.portfolioUrl = portfolioUrl;
    await student.save();
    res.json({ message: 'Profile updated successfully.', student });
  } catch (error) {
    console.error('[Failed to update profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/student/resume ─────────────────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    student.resumeUrl = req.file.path;
    await student.save();
    res.json({ message: 'Resume uploaded successfully.', resumeUrl: student.resumeUrl });
  } catch (error) {
    console.error('[Failed to upload resume.] Resume upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message || error });
  }
};

// ─── POST /api/student/profile-image ─────────────────────────────────────────
const uploadProfileImage = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    student.profileImageUrl = req.file.path;
    await student.save();
    res.json({ message: 'Profile image uploaded.', profileImageUrl: student.profileImageUrl });
  } catch (error) {
    console.error('[Failed to upload profile image.] Profile image upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message || error });
  }
};

// ─── GET /api/student/jobs ────────────────────────────────────────────────────
const searchJobs = async (req, res) => {
  try {
    const { category, location, keyword } = req.query;
    const where = { isActive: true, isArchived: false };
    if (category) where.category = category;
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const jobs = await JobPosting.findAll({
      where,
      include: [{ model: Company, attributes: ['companyName', 'industry', 'profileImageUrl', 'website'], where: { isVerified: true } }],
      order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
  } catch (error) {
    console.error('[Failed to fetch jobs.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/student/apply/:jobId ──────────────────────────────────────────
const applyForJob = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    if (!student.resumeUrl) return res.status(400).json({ message: 'Please upload a resume before applying.' });

    const existing = await Application.findOne({ where: { studentId: student.id, jobId: req.params.jobId } });
    if (existing) return res.status(400).json({ message: 'You have already applied for this job.' });

    const alreadyHired = await Application.findOne({ where: { studentId: student.id, status: 'HIRED' } });
    if (alreadyHired) {
      return res.status(400).json({ message: 'You have already been hired for an internship. You cannot apply to more jobs.' });
    }

    const application = await Application.create({
      studentId: student.id,
      jobId: req.params.jobId,
      status: 'PENDING',
      resumeSnapshot: student.resumeUrl,
    });
    res.status(201).json({ message: 'Application submitted successfully.', application });
  } catch (error) {
    console.error('[Failed to submit application.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/applications ───────────────────────────────────────────
const getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const applications = await Application.findAll({
      where: { studentId: student.id },
      include: [{
        model: JobPosting,
        attributes: ['id', 'title', 'category', 'location', 'allowance', 'duration'],
        include: [{ model: Company, attributes: ['id', 'companyName', 'profileImageUrl', 'industry', 'description', 'website', 'address'] }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(applications);
  } catch (error) {
    console.error('[Failed to fetch applications.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/dashboard ──────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const [total, pending, accepted, offered, hired, rejected] = await Promise.all([
      Application.count({ where: { studentId: student.id } }),
      Application.count({ where: { studentId: student.id, status: 'PENDING' } }),
      Application.count({ where: { studentId: student.id, status: 'ACCEPTED' } }),
      Application.count({ where: { studentId: student.id, status: 'OFFERED' } }),
      Application.count({ where: { studentId: student.id, status: 'HIRED' } }),
      Application.count({ where: { studentId: student.id, status: { [Op.in]: ['REJECTED', 'AUTO_REJECTED'] } } }),
    ]);

    // Fetch active OFFERED applications for the dashboard banner
    const offeredApplications = await Application.findAll({
      where: { studentId: student.id, status: 'OFFERED' },
      include: [{
        model: JobPosting,
        attributes: ['title'],
        include: [{ model: Company, attributes: ['companyName', 'profileImageUrl'] }]
      }],
      order: [['updatedAt', 'DESC']],
    });

    // Featured jobs — check cache first (Phase 5: API caching)
    const CACHE_KEY = 'featured_jobs';
    let featuredJobs = cache.get(CACHE_KEY);
    if (!featuredJobs) {
      featuredJobs = await JobPosting.findAll({
        where: { isActive: true, isArchived: false },
        include: [{ model: Company, attributes: ['companyName', 'profileImageUrl'], where: { isVerified: true } }],
        order: [['createdAt', 'DESC']],
        limit: 12,
      });
      cache.set(CACHE_KEY, featuredJobs, 5 * 60 * 1000); // 5-min TTL
    }

    res.json({
      student,
      stats: { total, pending, accepted, offered, hired, rejected },
      featuredJobs,
      offeredApplications,
    });
  } catch (error) {
    console.error('[Failed to fetch dashboard.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/recommended ────────────────────────────────────────────
// Smart matching: scores active jobs against the student's skills + degree
const getRecommended = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const studentSkills = (() => {
      try { return JSON.parse(student.skills || '[]'); } catch { return []; }
    })().map(s => s.toLowerCase().trim());

    const bio = (student.bio || '').toLowerCase();
    const degreeProgram = (student.degreeProgram || '').toLowerCase();

    // Category affinity map: keywords that appear in degree → likely matching categories
    const CATEGORY_MAP = {
      'computer': 'Information Technology',
      'software': 'Information Technology',
      'information': 'Information Technology',
      'data': 'Information Technology',
      'cyber': 'Information Technology',
      'artificial': 'Information Technology',
      'business': 'Marketing',
      'account': 'Finance',
      'finance': 'Finance',
      'engineering': 'Engineering',
      'electrical': 'Engineering',
      'mechanical': 'Engineering',
      'health': 'Healthcare',
      'biomedical': 'Healthcare',
      'pharmacy': 'Healthcare',
      'nursing': 'Healthcare',
      'education': 'Education',
      'marketing': 'Marketing',
    };

    // Determine preferred categories from degree
    const preferredCategories = new Set();
    Object.entries(CATEGORY_MAP).forEach(([keyword, category]) => {
      if (degreeProgram.includes(keyword)) preferredCategories.add(category);
    });

    // Fetch active jobs not yet applied to
    const appliedJobIds = (await Application.findAll({
      where: { studentId: student.id, status: { [Op.notIn]: ['WITHDRAWN', 'REJECTED', 'AUTO_REJECTED'] } },
      attributes: ['jobId'],
    })).map(a => a.jobId);

    const whereClause = {
      isActive: true,
      isArchived: false,
      ...(appliedJobIds.length > 0 ? { id: { [Op.notIn]: appliedJobIds } } : {}),
    };

    const allJobs = await JobPosting.findAll({
      where: whereClause,
      include: [{ model: Company, attributes: ['companyName', 'profileImageUrl', 'industry'], where: { isVerified: true } }],
      order: [['createdAt', 'DESC']],
    });

    // Score each job
    const scored = allJobs.map(job => {
      let score = 0;
      const requirements = (job.requirements || '').toLowerCase();
      const description = (job.description || '').toLowerCase();
      const title = (job.title || '').toLowerCase();
      const category = (job.category || '').toLowerCase();

      // Skill matching (+3 per skill found in requirements, +1 in description)
      studentSkills.forEach(skill => {
        if (skill.length < 2) return;
        if (requirements.includes(skill)) score += 3;
        else if (description.includes(skill)) score += 1;
        if (title.includes(skill)) score += 2;
      });

      // Category affinity
      if (preferredCategories.has(job.category)) score += 4;

      // Degree keywords in job text
      const degreeWords = degreeProgram.split(/\s+/).filter(w => w.length > 4);
      degreeWords.forEach(w => {
        if (requirements.includes(w) || description.includes(w)) score += 1;
      });

      // Bio keywords
      const bioWords = bio.split(/\s+/).filter(w => w.length > 5);
      bioWords.forEach(w => {
        if (requirements.includes(w) || title.includes(w)) score += 0.5;
      });

      return { job: job.toJSON(), score };
    });

    // Sort by score desc, take top 8, filter out score 0 if there are scored results
    const sorted = scored.sort((a, b) => b.score - a.score);
    const hasScored = sorted.some(x => x.score > 0);
    const top = (hasScored ? sorted.filter(x => x.score > 0) : sorted).slice(0, 8);

    res.json({ jobs: top.map(x => x.job), hasProfile: studentSkills.length > 0 || bio.length > 0 });
  } catch (error) {
    console.error('[Failed to fetch recommendations.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/notifications/count ─────────────────────────────────────
// Count of application status updates the student hasn't seen yet (drives the sidebar badge).
// PENDING is excluded — that's the state the student created, not an update from the company.
const getUpdateCount = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.json({ count: 0 });
    const count = await Application.count({
      where: { studentId: student.id, studentSeenAt: null, status: { [Op.ne]: 'PENDING' } },
    });
    res.json({ count });
  } catch (error) {
    console.error('[Failed to fetch notification count.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/student/notifications/mark-seen ────────────────────────────────
// Body: { applicationId? } — marks one application seen, or all if omitted.
const markUpdatesSeen = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    // req.body is undefined (not {}) when a request has no body at all —
    // StudentLayout.jsx's "mark all as seen" call does exactly this
    // (api.post(url) with no data argument), which crashed the destructure.
    const { applicationId } = req.body || {};
    const where = { studentId: student.id, studentSeenAt: null };
    if (applicationId) where.id = applicationId;
    await Application.update({ studentSeenAt: new Date() }, { where });
    res.json({ message: 'Marked as seen.' });
  } catch (error) {
    console.error('[Failed to mark as seen.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/notifications/hired-celebration ─────────────────────────
// Returns the most recent not-yet-celebrated HIRED application, or null.
const getHiredCelebration = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.json({ application: null });
    const application = await Application.findOne({
      where: { studentId: student.id, status: 'HIRED', studentSeenAt: null },
      include: [{
        model: JobPosting,
        attributes: ['title'],
        include: [{ model: Company, attributes: ['companyName', 'profileImageUrl'] }]
      }],
      order: [['updatedAt', 'DESC']],
    });
    res.json({ application });
  } catch (error) {
    console.error('[Failed to fetch celebration status.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/chats ───────────────────────────────────────────────────
const getMyChats = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const rooms = await ChatRoom.findAll({
      where: { studentId: student.id },
      include: [{ model: Company, attributes: ['companyName', 'profileImageUrl'] }]
    });

    // Per-room unread count so the conversation list can badge which company sent unread messages
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

// ─── GET /api/student/unread-count ───────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.json({ count: 0 });
    const rooms = await ChatRoom.findAll({ where: { studentId: student.id }, attributes: ['id'] });
    const roomIds = rooms.map(r => r.id);
    if (roomIds.length === 0) return res.json({ count: 0 });
    const count = await Message.count({
      where: { chatRoomId: { [Op.in]: roomIds }, senderUserId: { [Op.ne]: req.user.id }, isRead: false }
    });
    res.json({ count });
  } catch (error) {
    console.error('[Failed to fetch unread count.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/student/applications/:id ───────────────────────────────────────
// Withdraw from PENDING, ACCEPTED, or OFFERED applications
// response: 'WITHDRAWN' (from PENDING/ACCEPTED/OFFERED) or, once OFFERED,
// 'HIRED' (Accept Offer) / 'REJECTED' (Decline Offer).
const respondToOffer = async (req, res) => {
  try {
    const { response } = req.body;
    if (!['WITHDRAWN', 'HIRED', 'REJECTED'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response.' });
    }

    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const application = await Application.findOne({
      where: { id: req.params.id, studentId: student.id },
      include: [{
        model: JobPosting,
        include: [{ model: Company, include: [{ model: User, attributes: ['email'] }] }],
      }],
    });
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    // ── WITHDRAWN — unchanged from prior behavior ─────────────────────────────
    if (response === 'WITHDRAWN') {
      if (!['PENDING', 'ACCEPTED', 'OFFERED'].includes(application.status)) {
        return res.status(400).json({ message: `Cannot withdraw an application with status: ${application.status}.` });
      }
      application.status = 'WITHDRAWN';
      await application.save();
      return res.json({ message: 'Application withdrawn.', application });
    }

    // HIRED/REJECTED here mean "Accept Offer"/"Decline Offer" — only valid
    // once the company has actually extended a formal offer.
    if (application.status !== 'OFFERED') {
      return res.status(400).json({ message: `Cannot respond to an offer with status: ${application.status}.` });
    }

    const companyEmail = application.JobPosting?.Company?.User?.email;
    const companyName = application.JobPosting?.Company?.companyName;
    const jobTitle = application.JobPosting?.title;
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    // ── HIRED — Accept Offer: mirrors companyController's own HIRED branch
    // (positionsLeft decrement, auto-reject the student's other active apps) ──
    if (response === 'HIRED') {
      const t = await sequelize.transaction();
      let job;
      let lockedApplication;
      try {
        // Re-fetch and lock the Application itself — closes the TOCTOU gap where
        // a double-click or concurrent request could both pass the earlier
        // unlocked status check and both process the same accept-offer.
        lockedApplication = await Application.findByPk(application.id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedApplication || lockedApplication.status !== 'OFFERED') {
          await t.rollback();
          return res.status(409).json({ message: 'This application has already been processed.' });
        }

        job = await JobPosting.findByPk(application.jobId, { transaction: t, lock: t.LOCK.UPDATE });
        if (job.positionsLeft <= 0) {
          await t.rollback();
          return res.status(400).json({ message: 'No positions left for this job. Cannot accept.' });
        }

        lockedApplication.status = 'HIRED';
        lockedApplication.studentSeenAt = new Date(); // the student is the one acting, so it's already "seen"
        await lockedApplication.save({ transaction: t });

        job.positionsLeft -= 1;
        if (job.positionsLeft === 0) {
          job.isActive = false;
          job.isArchived = true;
        }
        await job.save({ transaction: t });

        await Application.update(
          { status: 'AUTO_REJECTED', studentSeenAt: null },
          {
            where: {
              studentId: student.id,
              id: { [Op.ne]: application.id },
              status: { [Op.in]: ['PENDING', 'ACCEPTED', 'OFFERED'] },
            },
            transaction: t,
          }
        );

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }

      // Non-blocking notifications — fired only after the transaction commits,
      // never awaited, always caught (see utils/mailer.js for the internal
      // try/catch too — a dead SMTP server can never break this response).
      if (companyEmail) {
        sendCompanyEmail(companyEmail, companyName, studentName, jobTitle, 'OFFER_ACCEPTED')
          .catch(err => console.error('[email] sendCompanyEmail(OFFER_ACCEPTED) failed:', err.message));
      }
      if (student.supervisorId && student.supervisorStatus === 'APPROVED') {
        Supervisor.findByPk(student.supervisorId, { include: [{ model: User, attributes: ['email'] }] })
          .then(supervisor => {
            if (supervisor?.User?.email) {
              const supervisorName = `${supervisor.firstName} ${supervisor.lastName}`.trim();
              sendSupervisorEmail(supervisor.User.email, supervisorName, studentName, companyName, 'ACTION_REQUIRED')
                .catch(err => console.error('[email] sendSupervisorEmail(ACTION_REQUIRED) failed:', err.message));
            }
          })
          .catch(err => console.error('[email] Supervisor lookup failed:', err.message));
      }

      return res.json({ message: 'Offer accepted — congratulations!', application: lockedApplication, positionsLeft: job.positionsLeft });
    }

    // ── REJECTED — Decline Offer: lock the chat room, notify the company ─────
    if (response === 'REJECTED') {
      application.status = 'REJECTED';
      application.studentSeenAt = new Date();
      await application.save();

      await ChatRoom.update(
        { isLocked: true },
        { where: { studentId: student.id, companyId: application.JobPosting?.companyId } }
      );

      if (companyEmail) {
        sendCompanyEmail(companyEmail, companyName, studentName, jobTitle, 'OFFER_REJECTED')
          .catch(err => console.error('[email] sendCompanyEmail(OFFER_REJECTED) failed:', err.message));
      }

      return res.json({ message: 'Offer declined.', application });
    }
  } catch (error) {
    console.error('[Failed to respond to offer.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/student/applications/:id/confirm-slot ──────────────────────────
// Student picks one of the interview slots proposed by the company
const confirmInterviewSlot = async (req, res) => {
  try {
    const { slot } = req.body;
    if (!slot) return res.status(400).json({ message: 'A slot is required.' });

    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const application = await Application.findOne({ where: { id: req.params.id, studentId: student.id } });
    if (!application) return res.status(404).json({ message: 'Application not found.' });
    if (application.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Can only confirm a slot for ACCEPTED applications.' });
    }

    const slots = application.interviewSlots;
    if (!slots || !slots.includes(slot)) {
      return res.status(400).json({ message: 'Invalid slot. Please pick one of the offered times.' });
    }

    application.confirmedSlot = slot;
    await application.save();
    res.json({ message: 'Interview slot confirmed.', application });
  } catch (error) {
    console.error('[Failed to confirm slot.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/student/public/:studentId ───────────────────────────────────────
// Read-only student profile — the only real caller is a COMPANY reviewing an
// applicant (ApplicantPipelinePanel / CompanyATS). This returns real PII
// (email, phone, resumeUrl, ucsiId), so unlike most /public/ routes it needs
// a real authorization check, not just "any logged-in user can fetch any ID":
// a company may only view students who have actually applied to one of its
// own job postings; nobody else (including other students) has a legitimate
// reason to pull an arbitrary student's profile by ID.
const getPublicStudentProfile = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.studentId, {
      include: [{ model: User, attributes: ['email'] }],
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (req.user.role === 'ADMIN') {
      return res.json(student);
    }

    if (req.user.role === 'COMPANY') {
      const company = await Company.findOne({ where: { userId: req.user.id } });
      if (!company) return res.status(404).json({ message: 'Company profile not found.' });

      const hasApplied = await Application.findOne({
        where: { studentId: student.id },
        include: [{ model: JobPosting, where: { companyId: company.id }, attributes: [] }],
      });
      if (!hasApplied) {
        return res.status(403).json({ message: 'You can only view profiles of students who applied to your job postings.' });
      }
      return res.json(student);
    }

    return res.status(403).json({ message: 'Not authorized to view this profile.' });
  } catch (error) {
    console.error('[Failed to fetch student profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── DELETE /api/student/account ─────────────────────────────────────────────
const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isArchived = true;
    await user.save();
    res.json({ message: 'Account deactivated. You will be signed out.' });
  } catch (error) {
    console.error('[Failed to deactivate account.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = {
  getProfile, updateProfile,
  requestSupervisor,
  uploadResume, upload,
  uploadProfileImage, uploadProfileImageMulter,
  searchJobs,
  applyForJob,
  getMyApplications,
  getDashboard,
  getRecommended,
  getMyChats,
  getUnreadCount,
  getUpdateCount, markUpdatesSeen, getHiredCelebration,
  respondToOffer,
  confirmInterviewSlot,
  getPublicStudentProfile,
  deactivateAccount,
};
