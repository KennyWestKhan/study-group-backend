const { StudyLog, User } = require('../models');
const { fn, col } = require('sequelize');

// @desc    Log a new study session hours
// @route   POST /api/logs
// @access  Private
const createStudyLog = async (req, res) => {
  try {
    const { topic, hours_studied } = req.body;
    
    if (!topic || !hours_studied) {
      return res.status(400).json({ message: 'Please provide topic and hours_studied' });
    }

    const log = await StudyLog.create({
      user_id: req.user.id,
      topic,
      hours_studied
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard analytics/logs for logged user
// @route   GET /api/logs/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const allLogs = await StudyLog.findAll({
      where: { user_id: userId },
      order: [['logged_date', 'DESC']]
    });

    const totalHours = allLogs.reduce((acc, log) => acc + log.hours_studied, 0);

    // Grouping manually to avoid strict SQL GROUP BY issues
    const topicStats = {};
    allLogs.forEach(log => {
      if (!topicStats[log.topic]) {
        topicStats[log.topic] = 0;
      }
      topicStats[log.topic] += log.hours_studied;
    });

    res.json({
      totalHours,
      topicStats,
      recentLogs: allLogs.slice(0, 5) // Show top 5 recent logs
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createStudyLog, getDashboardStats };
