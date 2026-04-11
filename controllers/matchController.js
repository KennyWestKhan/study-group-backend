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
        status: { [Op.ne]: 'Closed' },
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

      // Factor 1: Course Alignment (+50)
      if (user.course && session.course.toLowerCase().includes(user.course.toLowerCase())) {
        score += 50;
      } else if (user.course && user.course.toLowerCase().includes(session.course.toLowerCase())) {
        score += 30; // Inverse match
      }

      // Factor 2: Availability (+20)
      if (availabilityDays.length > 0) {
        const sessionDay = new Date(session.time)
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();
        if (availabilityDays.includes(sessionDay)) {
          score += 20;
        }
      }

      // Factor 3: Skill Level Alignment (+20)
      if (session.skill_level === user.skill_level) {
        score += 20;
      }

      // Factor 4: Expertise Alignment (+25)
      if (user.expertise && Array.isArray(user.expertise)) {
        const hasSkill = user.expertise.some(skill => 
          session.course.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(session.course.toLowerCase())
        );
        if (hasSkill) score += 25;
      }

      // Factor 5: Location Convenience (+10)
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
