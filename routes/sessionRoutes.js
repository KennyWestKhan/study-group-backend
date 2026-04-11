const express = require('express');
const { createSession, getSessions, joinSession, leaveSession, updateSession, deleteSession, getSessionMessages, getSessionById } = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getSessions)
  .post(protect, createSession);

router.route('/:id')
  .get(protect, getSessionById)
  .put(protect, updateSession)
  .delete(protect, deleteSession);

router.post('/:id/join', protect, joinSession);
router.post('/:id/leave', protect, leaveSession);
router.get('/:id/messages', protect, getSessionMessages);

module.exports = router;
