const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Determine if explicit AWS credentials or EC2 IAM Role is active
const hasExplicitKeys = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_ACCESS_KEY_ID.trim() !== '' &&
  process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_id' &&
  process.env.AWS_ACCESS_KEY_ID !== 'mock'
);

const isLocalFallbackActive = process.env.USE_LOCAL_S3_FALLBACK === 'true';

// S3 is enabled if:
// 1) Explicit credentials are provided and bucket is set, OR
// 2) S3 bucket is set and fallback is explicitly disabled (EC2 IAM Role / Default Credential Chain)
const isS3Enabled = Boolean(
  process.env.AWS_S3_BUCKET_NAME &&
  (hasExplicitKeys || !isLocalFallbackActive)
);

// Sanitize region string (e.g. if user passes "Asia Pacific (Mumbai) ap-south-1" extract "ap-south-1")
const sanitizeRegion = (rawRegion) => {
  if (!rawRegion) return 'ap-south-1';
  const match = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
  if (match) return match[0].toLowerCase();
  return rawRegion.trim().toLowerCase();
};

const region = sanitizeRegion(process.env.AWS_REGION);
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'mycourse-private-media-2026';

let s3Client = null;
if (isS3Enabled) {
  const s3Config = { region };
  if (hasExplicitKeys) {
    s3Config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    console.log(` AWS S3 Client Initialized with Static Credentials (Bucket: ${bucketName}, Region: ${region})`);
  } else {
    // Uses AWS SDK Default Credential Provider Chain (EC2 IAM Role: MyCourseEC2S3Role)
    console.log(` AWS S3 Client Initialized with IAM Role / Default Credential Chain (Bucket: ${bucketName}, Region: ${region})`);
  }
  s3Client = new S3Client(s3Config);
} else {
  console.log('ℹ AWS S3 credentials not configured. Local S3 Emulation Engine active.');
  // Ensure local uploads directory exists
  const localUploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
}

// Backwards-compatible flag for controllers
const hasRealAWSCreds = Boolean(s3Client);

// In-memory token store for local S3 simulation
const localTokenStore = new Map();

/**
 * Generate an S3 object key matching standard structure
 */
const generateObjectKey = (fileType, originalFilename, courseId = null) => {
  const ext = path.extname(originalFilename).toLowerCase();
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const safeFilename = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');

  if (fileType === 'avatar') {
    return `avatars/${timestamp}_${uniqueId}${ext}`;
  } else if (fileType === 'thumbnail') {
    return `thumbnails/${timestamp}_${uniqueId}${ext}`;
  } else if (fileType === 'video') {
    const courseFolder = courseId ? `courses/${courseId}/videos` : 'videos';
    return `${courseFolder}/${timestamp}_${safeFilename}_${uniqueId}${ext}`;
  } else if (fileType === 'note') {
    const courseFolder = courseId ? `courses/${courseId}/notes` : 'notes';
    return `${courseFolder}/${timestamp}_${safeFilename}_${uniqueId}${ext}`;
  }

  return `general/${timestamp}_${uniqueId}${ext}`;
};

/**
 * Validate upload parameters against allowed MIME types and limits
 */
const validateUploadRequest = ({ fileType, contentType, fileSize }) => {
  const rules = {
    avatar: {
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    thumbnail: {
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    video: {
      allowedMimes: [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-matroska',
        'video/ogg',
      ],
      maxSize: 500 * 1024 * 1024, // 500MB
    },
    note: {
      allowedMimes: ['application/pdf'],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
  };

  const rule = rules[fileType];
  if (!rule) {
    throw new Error(`Invalid file type: ${fileType}. Allowed types: avatar, thumbnail, video, note.`);
  }

  if (contentType && !rule.allowedMimes.includes(contentType.toLowerCase())) {
    throw new Error(
      `Unsupported MIME type: ${contentType}. Allowed for ${fileType}: ${rule.allowedMimes.join(', ')}`
    );
  }

  if (fileSize && fileSize > rule.maxSize) {
    const maxMb = Math.round(rule.maxSize / (1024 * 1024));
    throw new Error(`File size exceeds maximum limit of ${maxMb}MB for ${fileType}.`);
  }

  return true;
};

/**
 * Generate Presigned Upload URL (PUT)
 */
const getPresignedUploadUrl = async ({ fileType, originalFilename, contentType, courseId, fileSize }) => {
  validateUploadRequest({ fileType, contentType, fileSize });

  const objectKey = generateObjectKey(fileType, originalFilename, courseId);

  // If real AWS S3 is active
  if (hasRealAWSCreds && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    // 15-minute expiration for upload URL
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return {
      uploadUrl,
      objectKey,
      expiresIn: 900,
      mode: 'aws_s3',
    };
  }

  // Local emulation fallback
  const uploadToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;

  localTokenStore.set(uploadToken, {
    objectKey,
    contentType,
    expiresAt,
    fileType,
  });

  const uploadUrl = `/api/media/local-upload/${uploadToken}`;

  return {
    uploadUrl,
    objectKey,
    expiresIn: 900,
    mode: 'local_emulation',
  };
};

/**
 * Generate Presigned Read/Stream URL (GET)
 */
const getPresignedViewUrl = async (objectKey, options = {}) => {
  if (!objectKey) return null;

  const expiresIn = options.expiresIn || 7200; // 2 hours default
  const localPath = path.join(__dirname, '../uploads', objectKey.replace(/\//g, path.sep));

  // If local file exists or local fast streaming fallback is configured, serve via high-speed stream proxy
  if (fs.existsSync(localPath) || process.env.USE_LOCAL_S3_FALLBACK === 'true') {
    const streamToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + expiresIn * 1000;

    localTokenStore.set(streamToken, {
      objectKey,
      expiresAt,
      inline: !!options.inline,
    });

    return `/api/media/stream/${streamToken}`;
  }

  if (hasRealAWSCreds && s3Client) {
    const commandParams = {
      Bucket: bucketName,
      Key: objectKey,
    };

    if (options.inline) {
      commandParams.ResponseContentDisposition = 'inline';
    }

    if (options.contentType) {
      commandParams.ResponseContentType = options.contentType;
    }

    const command = new GetObjectCommand(commandParams);
    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  // Local emulation fallback
  const streamToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + expiresIn * 1000;

  localTokenStore.set(streamToken, {
    objectKey,
    expiresAt,
    inline: !!options.inline,
  });

  return `/api/media/stream/${streamToken}`;
};

/**
 * Clean and extract S3 object key from URL or path
 */
const extractCleanKey = (rawKey) => {
  if (!rawKey || typeof rawKey !== 'string') return null;
  let key = rawKey.trim();
  if (key.includes('amazonaws.com/')) {
    key = key.split('amazonaws.com/')[1] || key;
  }
  key = key.split('?')[0]; // strip query string
  if (key.startsWith('/')) key = key.substring(1);
  return key;
};

/**
 * Delete an object from S3 and local storage cache
 */
const deleteMediaObject = async (objectKey) => {
  const cleanKey = extractCleanKey(objectKey);
  if (!cleanKey) return;

  // 1. Delete from AWS S3 if configured
  if (hasRealAWSCreds && s3Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      });
      await s3Client.send(command);
      console.log(`🗑️ Successfully deleted object from AWS S3: ${cleanKey}`);
    } catch (err) {
      console.error(`Failed to delete S3 object ${cleanKey}:`, err.message);
    }
  }

  // 2. Delete from local filesystem cache (backend/uploads/...)
  try {
    const localPath = path.join(__dirname, '../uploads', cleanKey.replace(/\//g, path.sep));
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`🗑️ Successfully deleted local cached file: ${cleanKey}`);
    }
  } catch (err) {
    console.error(`Failed to delete local object ${cleanKey}:`, err.message);
  }

  // 3. Clear any matching ephemeral streaming tokens
  for (const [token, record] of localTokenStore.entries()) {
    if (record.objectKey === cleanKey) {
      localTokenStore.delete(token);
    }
  }
};

/**
 * Get S3 system status
 */
const getS3Status = () => {
  return {
    isConfigured: !!hasRealAWSCreds,
    bucketName: hasRealAWSCreds ? bucketName : 'local-emulation-bucket',
    region: hasRealAWSCreds ? region : 'local',
    mode: hasRealAWSCreds ? 'production_aws_s3' : 'local_emulation',
  };
};

module.exports = {
  getPresignedUploadUrl,
  getPresignedViewUrl,
  deleteMediaObject,
  getS3Status,
  localTokenStore,
  s3Client,
  bucketName,
  hasRealAWSCreds,
};

