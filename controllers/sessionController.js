const { StudySession, SessionMember, User, Message, File } = require('../models');
const { uploadFile } = require('../services/storageService');

// @desc    Create a study session
// @route   POST /api/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    const { course, description, time, location, max_members, skill_level } = req.body;

    if (!course || !time || !location) {
      return res.status(400).json({ message: 'Please provide course, time and location' });
    }
    if (isNaN(new Date(time).getTime())) {
      return res.status(400).json({ message: 'Invalid datetime format for time' });
    }
    if (max_members && parseInt(max_members) > 5) {
      return res.status(400).json({ message: 'Maximum members cannot exceed 5' });
    }

    const session = await StudySession.create({
      creator_id: req.user.id,
      course,
      description,
      time,
      location,
      max_members: max_members || 5,
      skill_level: skill_level || 'Beginner',
      status: 'Open'
    });
    
    // Automatically add the creator as a member
    await SessionMember.create({
      session_id: session.id,
      user_id: req.user.id
    });

    // Reload the session with associations to ensure frontend has member data
    const fullSession = await StudySession.findByPk(session.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'members', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(fullSession);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all study sessions
// @route   GET /api/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const sessions = await StudySession.findAll({
      where: {
        status: { [Op.ne]: 'Closed' }
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'members', attributes: ['id', 'name'] }
      ],
      order: [['time', 'ASC']]
    });
    const roomUsers = req.app.get('roomUsers') || {};
    const sessionsWithActive = sessions.map(s => {
      const activeInfo = roomUsers[s.id.toString()] || {};
      const activeCount = Object.keys(activeInfo).length;
      return { ...s.toJSON(), active_count: activeCount };
    });

    res.json(sessionsWithActive);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a study session
// @route   POST /api/sessions/:id/join
// @access  Private
const joinSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await StudySession.findByPk(sessionId, {
      include: [{ model: User, as: 'members' }]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status === 'Full' || session.members.length >= session.max_members) {
      return res.status(400).json({ message: 'Session is full' });
    }

    const isMember = session.members.some(member => member.id === req.user.id);
    if (isMember) {
      return res.status(400).json({ message: 'You have already joined this session' });
    }

    await SessionMember.create({
      session_id: session.id,
      user_id: req.user.id
    });

    if (session.members.length + 1 >= session.max_members) {
      session.status = 'Full';
      await session.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(session.id.toString()).emit('notification', {
        message: `${req.user.name} has joined the study session!`,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Successfully joined session' });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave a study session
// @route   POST /api/sessions/:id/leave
// @access  Private
const leaveSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await StudySession.findByPk(sessionId, {
      include: [{ model: User, as: 'members' }]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isMember = session.members.some(member => member.id === req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this session' });
    }

    await SessionMember.destroy({
      where: {
        session_id: session.id,
        user_id: req.user.id
      }
    });

    if (session.status === 'Full') {
      session.status = 'Open';
      await session.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(session.id.toString()).emit('notification', {
        message: `${req.user.name} has left the study session.`,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Successfully left session' });
  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a study session
// @route   PUT /api/sessions/:id
// @access  Private
const updateSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await StudySession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.creator_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }

    const { course, description, time, location, max_members, status, skill_level } = req.body;

    session.course = course || session.course;
    session.description = description !== undefined ? description : session.description;
    session.time = time || session.time;
    session.location = location || session.location;
    session.max_members = max_members || session.max_members;
    session.status = status || session.status;
    session.skill_level = skill_level || session.skill_level;

    await session.save();

    res.json(session);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a study session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await StudySession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.creator_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this session' });
    }

    await session.destroy();

    res.json({ message: 'Session removed' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages for a study session
// @route   GET /api/sessions/:id/messages
// @access  Private
const getSessionMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { session_id: req.params.id },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload a file to a study session
// @route   POST /api/sessions/:id/files
// @access  Private
const uploadSessionFile = async (req, res) => {
  try {
    const sessionId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadResult = await uploadFile(req.file);
    
    const file = await File.create({
      session_id: sessionId,
      user_id: req.user.id,
      filename: uploadResult.filename,
      url: uploadResult.url,
      mimetype: uploadResult.mimetype,
      size: uploadResult.size,
      storage_type: uploadResult.storage_type
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};

// @desc    Get all files for a study session
// @route   GET /api/sessions/:id/files
// @access  Private
const getSessionFiles = async (req, res) => {
  try {
    const files = await File.findAll({
      where: { session_id: req.params.id },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a study session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await StudySession.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'members', attributes: ['id', 'name'] }
      ]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  createSession, 
  getSessions, 
  joinSession, 
  leaveSession, 
  updateSession, 
  deleteSession, 
  getSessionMessages, 
  getSessionById,
  uploadSessionFile,
  getSessionFiles
};
