const path = require('path');
const fs = require('fs');
const {
  getPresignedUploadUrl,
  deleteMediaObject,
  localTokenStore,
  s3Client,
  bucketName,
  hasRealAWSCreds,
} = require('../services/s3Service');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

/**
 * @route   POST /api/admin/media/upload-url
 * @desc    Get S3 presigned PUT URL for direct client upload
 * @access  Private (Admin)
 */
const requestUploadUrl = async (req, res) => {
  try {
    const { fileType, originalFilename, contentType, courseId, fileSize } = req.body;

    if (!fileType || !originalFilename || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileType, originalFilename, and contentType are required.',
      });
    }

    const uploadData = await getPresignedUploadUrl({
      fileType,
      originalFilename,
      contentType,
      courseId,
      fileSize,
    });

    return res.status(200).json({
      success: true,
      data: uploadData,
    });
  } catch (error) {
    console.error('Request Upload URL Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate upload URL.',
    });
  }
};

/**
 * @route   POST /api/admin/media/confirm
 * @desc    Confirm successful upload and record metadata
 * @access  Private (Admin)
 */
const confirmUpload = async (req, res) => {
  try {
    const { objectKey, fileType, originalFilename, fileSize } = req.body;

    if (!objectKey) {
      return res.status(400).json({
        success: false,
        message: 'objectKey is required.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Upload confirmed successfully.',
      data: {
        objectKey,
        fileType,
        originalFilename,
        fileSize,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error confirming upload.',
    });
  }
};

/**
 * @route   DELETE /api/admin/media
 * @desc    Delete media object
 * @access  Private (Admin)
 */
const deleteMedia = async (req, res) => {
  try {
    const { objectKey } = req.body;
    if (!objectKey) {
      return res.status(400).json({
        success: false,
        message: 'objectKey is required.',
      });
    }

    await deleteMediaObject(objectKey);

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete media.',
    });
  }
};

/**
 * @route   PUT /api/media/local-upload/:token
 * @desc    Local S3 Emulation: Direct PUT handler
 * @access  Public (Secured by ephemeral cryptographic token)
 */
const handleLocalUpload = (req, res) => {
  const { token } = req.params;
  const tokenRecord = localTokenStore.get(token);

  if (!tokenRecord) {
    return res.status(403).json({ error: 'Invalid or expired upload token.' });
  }

  if (Date.now() > tokenRecord.expiresAt) {
    localTokenStore.delete(token);
    return res.status(403).json({ error: 'Upload token has expired.' });
  }

  const destinationPath = path.join(
    __dirname,
    '../uploads',
    tokenRecord.objectKey.replace(/\//g, path.sep)
  );

  // Ensure parent directory exists
  const dir = path.dirname(destinationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(destinationPath);

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    localTokenStore.delete(token);
    res.status(200).send('Upload completed.');
  });

  writeStream.on('error', (err) => {
    console.error('Local Upload Write Error:', err);
    res.status(500).json({ error: 'Failed to write file locally.' });
  });
};

/**
 * @route   GET /api/media/stream/:token
 * @desc    Local S3 Emulation: Stream video / PDF with range support
 * @access  Public (Secured by ephemeral cryptographic token)
 */
const handleLocalStream = async (req, res) => {
  const { token } = req.params;
  const tokenRecord = localTokenStore.get(token);

  if (!tokenRecord) {
    return res.status(403).json({ error: 'Invalid or expired streaming token.' });
  }

  if (Date.now() > tokenRecord.expiresAt) {
    localTokenStore.delete(token);
    return res.status(403).json({ error: 'Streaming token has expired.' });
  }

  const filePath = path.join(
    __dirname,
    '../uploads',
    tokenRecord.objectKey.replace(/\//g, path.sep)
  );

  if (!fs.existsSync(filePath)) {
    if (hasRealAWSCreds && s3Client) {
      try {
        const getParams = {
          Bucket: bucketName,
          Key: tokenRecord.objectKey,
        };
        if (req.headers.range) {
          getParams.Range = req.headers.range;
        }
        const s3Response = await s3Client.send(new GetObjectCommand(getParams));

        if (s3Response.ContentRange) {
          res.status(206);
          res.setHeader('Content-Range', s3Response.ContentRange);
        } else {
          res.status(200);
        }

        if (s3Response.AcceptRanges) res.setHeader('Accept-Ranges', s3Response.AcceptRanges);
        if (s3Response.ContentLength) res.setHeader('Content-Length', s3Response.ContentLength);
        if (s3Response.ContentType) res.setHeader('Content-Type', s3Response.ContentType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        s3Response.Body.pipe(res);

        // Background cache download to local disk for ultra-fast instant future streaming
        (async () => {
          try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const tempPath = filePath + '.download';
            if (!fs.existsSync(filePath) && !fs.existsSync(tempPath)) {
              const fullObj = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: tokenRecord.objectKey }));
              const ws = fs.createWriteStream(tempPath);
              fullObj.Body.pipe(ws);
              ws.on('finish', () => {
                try {
                  if (fs.existsSync(tempPath)) fs.renameSync(tempPath, filePath);
                } catch (e) {}
              });
            }
          } catch (bgErr) {}
        })();

        return;
      } catch (s3Err) {
        console.error('S3 proxy streaming failed:', s3Err.message);
      }
    }
    return res.status(404).json({ error: 'Media file not found on disk or S3.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Determine content type based on extension
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (['.mp4', '.m4v'].includes(ext)) contentType = 'video/mp4';
  else if (['.webm'].includes(ext)) contentType = 'video/webm';
  else if (['.pdf'].includes(ext)) contentType = 'application/pdf';
  else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
  else if (['.png'].includes(ext)) contentType = 'image/png';
  else if (['.webp'].includes(ext)) contentType = 'image/webp';

  // Support HTTP Range requests for video seeking
  if (range && contentType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=86400',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=86400',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

module.exports = {
  requestUploadUrl,
  confirmUpload,
  deleteMedia,
  handleLocalUpload,
  handleLocalStream,
};

