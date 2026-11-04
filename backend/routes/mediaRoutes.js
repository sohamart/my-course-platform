const express = require('express');
const router = express.Router();
const {
  requestUploadUrl,
  confirmUpload,
  deleteMedia,
  handleLocalUpload,
  handleLocalStream,
} = require('../controllers/mediaController');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');

// User avatar upload URL (Available to both Student & Admin)
router.post('/avatar-upload-url', authenticateJWT, (req, res, next) => {
  req.body.fileType = 'avatar';
  requestUploadUrl(req, res, next);
});

// Admin-only S3 operations
router.post('/admin/upload-url', authenticateJWT, requireAdmin, requestUploadUrl);
router.post('/admin/confirm', authenticateJWT, requireAdmin, confirmUpload);
router.delete('/admin', authenticateJWT, requireAdmin, deleteMedia);

// Local S3 emulation direct endpoints (authenticated via one-time signed cryptographic tokens)
router.put('/local-upload/:token', handleLocalUpload);
router.get('/stream/:token', handleLocalStream);

module.exports = router;

