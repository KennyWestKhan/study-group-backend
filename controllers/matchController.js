const { StudySession, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get study session matches for logged-in user
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res) => {
  try {
    const user = req.user;
    
    // Find all Open sessions
    const sessions = await StudySession.findAll({
      where: {
        status: 'Open',
        time: {
          [Op.gt]: new Date()
        }
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'skill_level'] },
        { model: User, as: 'members', attributes: ['id', 'name'] }
      ]
    });
    
    // Check if user availability contains the session's day of week
    // availability is stored as JSON array e.g. ["Monday 10:00", "Wednesday 14:00"]
    let availabilityDays = [];
    if (user.availability) {
      const avail = Array.isArray(user.availability) ? user.availability : [];
      availabilityDays = avail.map(entry =>
        typeof entry === 'string' ? entry.split(' ')[0].toLowerCase() : ''
      );
    }

    const scoredSessions = sessions.map(session => {
      let score = 0;

      // +40 if same course
      if (user.course && session.course.toLowerCase().includes(user.course.toLowerCase())) {
        score += 40;
      }

      // +30 if overlapping availability
      if (availabilityDays.length > 0) {
        const sessionDay = new Date(session.time)
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();
        if (availabilityDays.includes(sessionDay)) {
          score += 30;
        }
      }

      // +20 if same skill level
      if (session.creator && session.creator.skill_level === user.skill_level) {
        score += 20;
      }

      // +10 if same location
      if (user.location && session.location.toLowerCase() === user.location.toLowerCase()) {
        score += 10;
      }

      return { ...session.toJSON(), match_score: score };
    });
    
    // Sort highest score first
    scoredSessions.sort((a, b) => b.match_score - a.match_score);
    
    res.json(scoredSessions);
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMatches };
