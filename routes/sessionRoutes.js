const express = require('express');
const { createSession, getSessions, joinSession, leaveSession, updateSession, deleteSession } = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getSessions)
  .post(protect, createSession);

router.route('/:id')
  .put(protect, updateSession)
  .delete(protect, deleteSession);

router.post('/:id/join', protect, joinSession);
router.post('/:id/leave', protect, leaveSession);

module.exports = router;
