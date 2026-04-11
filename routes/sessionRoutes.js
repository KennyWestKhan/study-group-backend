const express = require('express');
const { 
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
} = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
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

router.route('/:id/files')
  .get(protect, getSessionFiles)
  .post(protect, upload.single('file'), uploadSessionFile);

module.exports = router;
