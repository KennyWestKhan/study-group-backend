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

    const topicStats = {};
    allLogs.forEach(log => {
      if (!topicStats[log.topic]) topicStats[log.topic] = 0;
      topicStats[log.topic] += log.hours_studied;
    });

    // Build last-7-days hourly breakdown for the activity chart
    const today = new Date();
    const weeklyHours = [];
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const dayTotal = allLogs
        .filter(log => log.logged_date === dateStr)
        .reduce((acc, log) => acc + log.hours_studied, 0);
      weeklyHours.push(dayTotal);
    }

    res.json({
      totalHours,
      topicStats,
      recentLogs: allLogs.slice(0, 5),
      weeklyHours,
      dayLabels
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createStudyLog, getDashboardStats };
