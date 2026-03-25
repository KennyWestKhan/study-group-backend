const { StudySession, SessionMember, User } = require('../models');

// @desc    Create a study session
// @route   POST /api/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    const { course, time, location, max_members } = req.body;

    if (!course || !time || !location) {
      return res.status(400).json({ message: 'Please provide course, time and location' });
    }
    if (isNaN(new Date(time).getTime())) {
      return res.status(400).json({ message: 'Invalid datetime format for time' });
    }

    const session = await StudySession.create({
      creator_id: req.user.id,
      course,
      time,
      location,
      max_members: max_members || 5,
      status: 'Open'
    });

    // Auto join the creator to the session
    await SessionMember.create({
      session_id: session.id,
      user_id: req.user.id
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all study sessions
// @route   GET /api/sessions
// @access  Public or Private (depending on preference)
const getSessions = async (req, res) => {
  try {
    const sessions = await StudySession.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'members', attributes: ['id', 'name'] }
      ],
      order: [['time', 'ASC']]
    });
    res.json(sessions);
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

    // Check if user already joined
    const isMember = session.members.some(member => member.id === req.user.id);
    if (isMember) {
      return res.status(400).json({ message: 'You have already joined this session' });
    }

    await SessionMember.create({
      session_id: session.id,
      user_id: req.user.id
    });

    // Check if it's now full and update status
    if (session.members.length + 1 >= session.max_members) {
      session.status = 'Full';
      await session.save();
    }

    // Emit in-app notification to the group using Socket.io
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

    // If session was full, and member left, open it up
    if (session.status === 'Full') {
      session.status = 'Open';
      await session.save();
    }

    // Emit in-app notification
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

    const { course, time, location, max_members, status } = req.body;

    session.course = course || session.course;
    session.time = time || session.time;
    session.location = location || session.location;
    session.max_members = max_members || session.max_members;
    session.status = status || session.status;

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

module.exports = { createSession, getSessions, joinSession, leaveSession, updateSession, deleteSession };
