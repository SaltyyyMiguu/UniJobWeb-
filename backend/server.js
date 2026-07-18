const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const { Op } = require('sequelize');
const { sequelize, ChatRoom, Message, Application } = require('./models');
const { cleanupLegacyJobs } = require('./cleanup-legacy-jobs');

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Local dev origins stay allowed unconditionally; FRONTEND_URL (the deployed
// Vercel URL in production) is added on top rather than replacing them, so
// this keeps working for local testing after deployment too.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static file serving with caching headers ──────────────────────────────
// Public assets: logos, listing covers — encourage browser caching (1 day)
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));
app.use('/uploads/listings', express.static(path.join(__dirname, 'uploads/listings'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Sensitive documents: resumes and offer letters — NEVER cache
app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads/resumes'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use('/uploads/offers', express.static(path.join(__dirname, 'uploads/offers'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Fallback static for any remaining /uploads paths
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'Welcome to UniJobLink API' }));
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/student',    require('./routes/studentRoutes'));
app.use('/api/company',    require('./routes/companyRoutes'));
app.use('/api/supervisor', require('./routes/supervisorRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));

// ─── In-memory: track which socket is viewing which room ─────────────────
// activeRooms[userId] = roomId — used to decide whether to emit unread event
const activeRooms = new Map();

// ─── WebSockets ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Register this socket's user so we can route unread events
  socket.on('register', ({ userId }) => {
    socket.userId = userId;
    socket.join(`user:${userId}`); // personal room for unread notifications
  });

  // Join a chat room
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    if (socket.userId) activeRooms.set(socket.userId, roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Leave a room (user navigates away from active chat)
  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    if (socket.userId) activeRooms.delete(socket.userId);
  });

  // Send & save a message; emit unread notification if recipient is away
  socket.on('sendMessage', async ({ roomId, senderUserId, content }) => {
    try {
      const room = await ChatRoom.findByPk(roomId);
      if (!room) return;

      // Determine recipient userId (the other party in the room)
      // We look up the other party's User id from Student/Company associations
      const { Student, Company, User } = require('./models');
      let recipientUserId = null;
      const student = await Student.findByPk(room.studentId, { attributes: ['userId'] });
      const company = await Company.findByPk(room.companyId, { attributes: ['userId'] });
      if (student && company) {
        recipientUserId = senderUserId === student.userId ? company.userId : student.userId;
      }

      // Determine if recipient is actively viewing this room
      const recipientActiveRoom = recipientUserId ? activeRooms.get(recipientUserId) : null;
      const isRead = recipientActiveRoom === roomId;

      const message = await Message.create({ chatRoomId: roomId, senderUserId, content, isRead });

      io.to(roomId).emit('receiveMessage', message);

      // Notify recipient if they are not in this room
      if (recipientUserId && !isRead) {
        io.to(`user:${recipientUserId}`).emit('new_unread_message', { roomId, message });
      }
    } catch (err) {
      console.error('Error saving message:', err.message);
    }
  });

  // Fetch history and mark messages from the other party as read
  socket.on('getHistory', async ({ roomId, userId }) => {
    try {
      const messages = await Message.findAll({
        where: { chatRoomId: roomId },
        order: [['createdAt', 'ASC']]
      });
      socket.emit('messageHistory', messages);

      // Mark all messages in this room not sent by the requester as read
      if (userId) {
        await Message.update(
          { isRead: true },
          { where: { chatRoomId: roomId, senderUserId: { [Op.ne]: userId }, isRead: false } }
        );
      }
    } catch (err) {
      console.error('Error fetching history:', err.message);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) activeRooms.delete(socket.userId);
    console.log('Socket disconnected:', socket.id);
  });
});

// ─── Cron: Auto-reject expired OFFERED applications ───────────────────────
// Runs every hour on the hour
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const [affectedCount] = await Application.update(
      { status: 'AUTO_REJECTED', studentSeenAt: null },
      {
        where: {
          status: 'OFFERED',
          offerExpiresAt: { [Op.lt]: now },
        }
      }
    );
    if (affectedCount > 0) {
      console.log(`[Cron] Auto-rejected ${affectedCount} expired offer(s).`);
    }
  } catch (err) {
    console.error('[Cron] Error auto-rejecting offers:', err.message);
  }
});

// ─── DB Sync & Server Start ────────────────────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established.');
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('Database synchronized.');
    // Run legacy job cleanup
    await cleanupLegacyJobs();
    // Ensure upload directories exist
    const fs = require('fs');
    ['uploads/resumes', 'uploads/profiles', 'uploads/listings', 'uploads/offers'].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  })
  .catch(err => console.error('Database error:', err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
