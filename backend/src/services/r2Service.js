import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import logger from '../utils/logger.js';

let s3ClientInstance = null;
let initialized = false;

function getR2Config() {
  return {
    endpoint: process.env.R2_ENDPOINT?.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
    bucketName: process.env.R2_BUCKET_NAME?.trim() || 'tormag-media',
    publicUrl: process.env.R2_PUBLIC_URL?.trim(),
  };
}

function getS3Client() {
  if (initialized) return s3ClientInstance;
  initialized = true;

  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();

  if (endpoint && accessKeyId && secretAccessKey) {
    try {
      s3ClientInstance = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      logger.info('[CLOUDFLARE R2] S3 Client initialized successfully.');
    } catch (err) {
      logger.error(`[CLOUDFLARE R2] Failed to initialize S3 Client: ${err.message}`);
    }
  } else {
    logger.warn('[CLOUDFLARE R2] Storage credentials incomplete in environment variables. Falling back to local storage.');
  }

  return s3ClientInstance;
}

export const isR2Configured = () => {
  const client = getS3Client();
  const { bucketName } = getR2Config();
  return Boolean(client && bucketName);
};

/**
 * Upload buffer to Cloudflare R2 bucket
 * @param {Object} params
 * @param {Buffer} params.buffer - Image binary buffer
 * @param {string} params.key - Virtual folder path + filename (e.g., 'products/123/image.webp')
 * @param {string} [params.contentType='image/webp'] - MIME type
 * @returns {Promise<{ key: string, url: string }>}
 */
export const uploadToR2 = async ({ buffer, key, contentType = 'image/webp' }) => {
  const client = getS3Client();
  const { bucketName, publicUrl, endpoint } = getR2Config();

  if (!client || !bucketName) {
    throw new Error('Cloudflare R2 is not properly configured.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  let finalUrl = '';
  if (publicUrl) {
    const baseUrl = publicUrl.replace(/\/+$/, '');
    finalUrl = `${baseUrl}/${cleanKey}`;
  } else {
    const cleanEndpoint = (endpoint || '').replace(/\/+$/, '');
    finalUrl = `${cleanEndpoint}/${bucketName}/${cleanKey}`;
  }

  logger.info(`[CLOUDFLARE R2] Successfully uploaded object: ${cleanKey} -> ${finalUrl}`);
  return { key: cleanKey, url: finalUrl };
};

/**
 * Delete object from Cloudflare R2 bucket
 * @param {string} keyOrUrl - Key or full URL of object to delete
 */
export const deleteFromR2 = async (keyOrUrl) => {
  const client = getS3Client();
  const { bucketName } = getR2Config();

  if (!client || !bucketName || !keyOrUrl) return;

  let key = keyOrUrl;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const parsed = new URL(keyOrUrl);
      key = parsed.pathname.replace(/^\/+/, '');
      if (key.startsWith(`${bucketName}/`)) {
        key = key.substring(bucketName.length + 1);
      }
    } catch {
      key = keyOrUrl;
    }
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    logger.info(`[CLOUDFLARE R2] Successfully deleted object: ${key}`);
  } catch (err) {
    logger.error(`[CLOUDFLARE R2] Failed to delete object ${key}: ${err.message}`);
  }
};
