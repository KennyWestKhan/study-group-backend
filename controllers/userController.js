const { User } = require('../models');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.course = req.body.course || user.course;
    user.skill_level = req.body.skill_level || user.skill_level;
    if (req.body.availability !== undefined) user.availability = req.body.availability;
    user.location = req.body.location || user.location;
    if (req.body.expertise !== undefined) user.expertise = req.body.expertise;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      course: user.course,
      skill_level: user.skill_level,
      availability: user.availability,
      location: user.location,
      expertise: user.expertise
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile };
